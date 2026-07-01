require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_record/railtie"
require "active_job/railtie"

Bundler.require(*Rails.groups)

module MemoryAiWorker
  class Application < Rails::Application
    config.load_defaults 8.0

    # API-only mode — no web views
    config.api_only = true

    # Use GoodJob as the Active Job backend
    config.active_job.queue_adapter = :good_job

    # Autoload app directories
    config.autoload_paths += %W[#{config.root}/app/services]

    # Timezone
    config.time_zone = "Tokyo"
  end
end
