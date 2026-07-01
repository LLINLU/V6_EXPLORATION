class ReportPollerJob < ApplicationJob
  queue_as :default

  # Runs every 10 seconds via GoodJob cron.
  # Detects reports with status='pending' and enqueues an orchestrator job for each.
  # Duplicate prevention is handled by ReportOrchestratorJob's GoodJob concurrency control.
  def perform
    pending_reports = ScenarioReport.where(status: "pending")

    pending_reports.find_each do |report|
      ReportOrchestratorJob.perform_later(report.id)
      Rails.logger.info("[ReportPoller] Enqueued orchestrator for report=#{report.id}")
    end
  end
end
