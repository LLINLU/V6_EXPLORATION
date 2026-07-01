Rails.application.configure do
  config.good_job.execution_mode = :external
  config.good_job.poll_interval = 5
  config.good_job.max_threads = 3
  config.good_job.shutdown_timeout = 60
  config.good_job.enable_cron = true

  config.good_job.cron = {
    report_poller: {
      cron: "*/10 * * * * *", # every 10 seconds
      class: "ReportPollerJob",
      description: "Poll for pending scenario reports"
    },
    section_retry_poller: {
      cron: "*/15 * * * * *", # every 15 seconds
      class: "SectionRetryPollerJob",
      description: "Poll for retry-requested sections"
    }
  }
end
