class SectionRetryPollerJob < ApplicationJob
  queue_as :default

  # Runs every 15 seconds via GoodJob cron.
  # Detects sections that have been reset to 'pending' for retry
  # (i.e., the report is no longer 'pending' itself, and the section's
  # updated_at is sufficiently after created_at — indicating a manual retry).
  def perform
    retry_sections = ScenarioReportSection
      .joins("INNER JOIN scenario_reports ON scenario_reports.id = scenario_report_sections.report_id")
      .where(status: "pending")
      .where.not("scenario_reports.status" => "pending")
      .where("scenario_report_sections.updated_at > scenario_report_sections.created_at + interval '30 seconds'")

    retry_sections.find_each do |section|
      Rails.logger.info(
        "[SectionRetryPoller] Processing retry for section=#{section.section_type} " \
        "report=#{section.report_id}"
      )

      process_section_retry(section)
    end
  end

  private

  def process_section_retry(section)
    report = section.report

    if ScenarioReport::ANALYSIS_SECTIONS.include?(section.section_type)
      process_analysis_retry(section, report)
    elsif ScenarioReport::DERIVED_SECTIONS.include?(section.section_type)
      process_derived_retry(section, report)
    end
  end

  def process_analysis_retry(section, report)
    section.mark_running!
    client = SearchApiClient.new

    begin
      result = client.analyze(section.section_type, report)
      section.mark_done!(:raw_data, result)
      Rails.logger.info("[SectionRetryPoller] #{section.section_type} retry succeeded")
    rescue => e
      section.mark_error!("Retry failed: #{e.message}")
      Rails.logger.error("[SectionRetryPoller] #{section.section_type} retry failed: #{e.message}")
    end
  end

  def process_derived_retry(section, report)
    section.mark_running!

    begin
      data = case section.section_type
             when "research_landscape"
               DerivedSectionBuilder.build_research_landscape(report)
             when "market_implementations"
               DerivedSectionBuilder.build_market_implementations(report)
             when "executive_summary"
               analysis_data = {}
               report.sections.where(section_type: ScenarioReport::ANALYSIS_SECTIONS).each do |sec|
                 analysis_data[sec.section_type] = sec.raw_data if sec.raw_data
               end
               DerivedSectionBuilder.build_executive_summary(report, analysis_data)
             end

      section.mark_done!(:transformed_data, data)
      Rails.logger.info("[SectionRetryPoller] #{section.section_type} retry succeeded")
    rescue => e
      section.mark_error!("Retry failed: #{e.message}")
      Rails.logger.error("[SectionRetryPoller] #{section.section_type} retry failed: #{e.message}")
    end
  end
end
