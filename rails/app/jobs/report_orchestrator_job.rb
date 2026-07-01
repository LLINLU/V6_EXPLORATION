class ReportOrchestratorJob < ApplicationJob
  include GoodJob::ActiveJobExtensions::Concurrency

  queue_as :default

  # Prevent duplicate orchestrator jobs for the same report
  good_job_control_concurrency_with(
    key: -> { "orchestrator-#{arguments.first}" },
    total_limit: 1
  )

  ANALYSIS_RETRY_COUNT = 3
  SEARCH_RETRY_COUNT = 3

  # Master job: runs the full pipeline for a single report.
  #
  # Phase 1: Search    — POST /v5/pipeline/search (SSE, ~5min)
  # Phase 2: Analyze   — 4 sections in parallel threads (~5-10min each, 3 retries)
  # Phase 3: Derived   — 3 sections in parallel threads (local, <30s)
  # Phase 4: Finalize  — report.status = 'done'
  def perform(report_id)
    report = ScenarioReport.find(report_id)
    client = SearchApiClient.new

    Rails.logger.info("[Orchestrator] Starting pipeline for report=#{report_id}")

    # ── Phase 1: Search (with retry + progressive DB updates) ──
    search_result = nil
    SEARCH_RETRY_COUNT.times do |attempt|
      begin
        report.update!(status: "searching", search_status: "running", updated_at: Time.current)

        search_result = client.search(report) do |event|
          handle_search_event(report, event)
        end
        break
      rescue => e
        if attempt < SEARCH_RETRY_COUNT - 1
          Rails.logger.warn(
            "[Orchestrator] Search attempt #{attempt + 1}/#{SEARCH_RETRY_COUNT} failed for report=#{report_id}: #{e.message}, retrying..."
          )
          sleep(2 ** attempt)
        else
          Rails.logger.error("[Orchestrator] Search failed after #{SEARCH_RETRY_COUNT} attempts for report=#{report_id}: #{e.message}")
          report.update!(
            status: "error",
            search_status: "error",
            error_message: e.message.truncate(1000),
            updated_at: Time.current
          )
          return
        end
      end
    end

    articles = search_result["articles"] || []
    patents  = search_result["patents"] || []
    markets  = search_result["markets"] || []

    report.update!(
      articles: articles,
      patents: patents,
      markets: markets,
      search_status: "done",
      status: "search_done",
      updated_at: Time.current
    )

    Rails.logger.info(
      "[Orchestrator] Search complete: #{articles.size} articles, " \
      "#{patents.size} patents, #{markets.size} markets"
    )

    # ── Phase 2: Analyze (4 sections in parallel) ──
    report.update!(status: "analyzing", updated_at: Time.current)

    analysis_threads = ScenarioReport::ANALYSIS_SECTIONS.map do |section_type|
      Thread.new(section_type) do |st|
        ActiveRecord::Base.connection_pool.with_connection do
          process_analysis_section(report, client, st)
        end
      end
    end

    analysis_threads.each(&:join)

    # Reload to get updated section statuses
    report.reload

    Rails.logger.info("[Orchestrator] Analysis phase complete for report=#{report_id}")

    # ── Phase 3: Derived (3 sections in parallel) ──
    derived_threads = ScenarioReport::DERIVED_SECTIONS.map do |section_type|
      Thread.new(section_type) do |st|
        ActiveRecord::Base.connection_pool.with_connection do
          process_derived_section(report, st)
        end
      end
    end

    derived_threads.each(&:join)

    # ── Phase 4: Finalize ──
    report.reload

    if report.all_sections_done?
      report.update!(status: "done", updated_at: Time.current)
      Rails.logger.info("[Orchestrator] Report #{report_id} completed successfully")
    elsif report.any_section_error?
      # Some sections failed but we still mark done with partial results
      report.update!(status: "done", updated_at: Time.current)
      Rails.logger.warn("[Orchestrator] Report #{report_id} completed with some section errors")
    else
      report.update!(status: "done", updated_at: Time.current)
      Rails.logger.info("[Orchestrator] Report #{report_id} finalized")
    end
  end

  private

  # Handle each SSE event from the Search API and progressively update the DB.
  # This lets the frontend polling show intermediate results as they arrive.
  def handle_search_event(report, event)
    case event["type"]
    when "progress"
      phase = event["phase"]
      progress = event["progress"]
      Rails.logger.info("[Orchestrator] Search progress: phase=#{phase} progress=#{progress}")

      # If the progress event carries partial data, persist it immediately
      data = event["data"]
      if data.is_a?(Hash)
        updates = { updated_at: Time.current }
        updates[:articles] = data["articles"] if data["articles"].is_a?(Array)
        updates[:patents]  = data["patents"]  if data["patents"].is_a?(Array)
        updates[:markets]  = data["markets"]  if data["markets"].is_a?(Array)
        report.update!(updates) if updates.size > 1
      end
    when "result"
      Rails.logger.info("[Orchestrator] Search result event received")
    end
  rescue => e
    # Never let a progress-update failure kill the search stream
    Rails.logger.warn("[Orchestrator] handle_search_event error (non-fatal): #{e.message}")
  end

  def process_analysis_section(report, client, section_type)
    section = report.sections.find_by!(section_type: section_type)
    section.mark_running!

    last_error = nil
    ANALYSIS_RETRY_COUNT.times do |attempt|
      begin
        Rails.logger.info("[Orchestrator] Analyzing #{section_type} (attempt #{attempt + 1}/#{ANALYSIS_RETRY_COUNT})")

        result = client.analyze(section_type, report)
        section.mark_done!(:raw_data, result)

        Rails.logger.info("[Orchestrator] #{section_type} analysis done")
        return
      rescue => e
        last_error = e
        Rails.logger.warn("[Orchestrator] #{section_type} attempt #{attempt + 1} failed: #{e.message}")
        sleep(2 ** attempt) if attempt < ANALYSIS_RETRY_COUNT - 1
      end
    end

    section.mark_error!("All #{ANALYSIS_RETRY_COUNT} attempts failed. Last error: #{last_error&.message}")
    Rails.logger.error("[Orchestrator] #{section_type} analysis failed after #{ANALYSIS_RETRY_COUNT} attempts")
  rescue => e
    Rails.logger.error("[Orchestrator] #{section_type} unexpected error: #{e.message}")
    section&.mark_error!(e.message)
  end

  def process_derived_section(report, section_type)
    section = report.sections.find_by!(section_type: section_type)
    section.mark_running!

    data = case section_type
           when "research_landscape"
             DerivedSectionBuilder.build_research_landscape(report)
           when "market_implementations"
             DerivedSectionBuilder.build_market_implementations(report)
           when "executive_summary"
             # Load analysis results from completed sections
             analysis_data = {}
             report.sections.where(section_type: ScenarioReport::ANALYSIS_SECTIONS).each do |sec|
               analysis_data[sec.section_type] = sec.raw_data if sec.raw_data
             end
             DerivedSectionBuilder.build_executive_summary(report, analysis_data)
           end

    section.mark_done!(:transformed_data, data)
    Rails.logger.info("[Orchestrator] #{section_type} derived section done")
  rescue => e
    Rails.logger.error("[Orchestrator] #{section_type} derived section failed: #{e.message}")
    section = report.sections.find_by(section_type: section_type)
    section&.mark_error!(e.message)
  end
end
