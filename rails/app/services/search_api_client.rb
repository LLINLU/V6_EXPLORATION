class SearchApiClient
  SEARCH_TIMEOUT  = 600  # 10 minutes
  ANALYZE_TIMEOUT = 900  # 15 minutes

  class ApiError < StandardError; end

  def initialize
    @base_url = ENV.fetch("SEARCH_API_URL", "https://search-api.stg.memoryai.jp")
    @user     = ENV.fetch("SEARCH_API_USER", "admin")
    @pass     = ENV.fetch("SEARCH_API_PASS", "adminpassword")
  end

  # POST /v5/pipeline/search — SSE response (streaming)
  # Yields each parsed SSE event to the block for progressive DB updates.
  # Returns the final result { articles: [], patents: [], markets: [] }
  #
  # Usage:
  #   client.search(report) do |event|
  #     # event is a parsed Hash, e.g. {"type"=>"progress", "phase"=>"articles", ...}
  #     report.update!(search_progress: event)
  #   end
  def search(report, &on_event)
    body = build_search_body(report)
    buffer = ""
    final_result = nil
    error_detected = false
    error_message = nil

    streaming_connection(timeout: SEARCH_TIMEOUT).post("/v5/pipeline/search") do |req|
      req.headers["Content-Type"] = "application/json"
      req.headers["User-Agent"]   = "MemoryAI-Worker/1.0"
      req.body = body.to_json
      req.options.on_data = proc do |chunk, _overall_received_bytes, env|
        if env&.status && env.status >= 400
          error_detected = true
          error_message = "Search API #{env.status}"
          next
        end

        buffer += chunk

        while (idx = buffer.index("\n"))
          line = buffer.slice!(0..idx).strip
          next if line.empty?
          next unless line.start_with?("data: ")

          json_str = line[6..]
          begin
            event = JSON.parse(json_str)

            if event["type"] == "error"
              msg = event["message_en"].presence || event["message_ja"] || "Unknown SSE error"
              error_detected = true
              error_message = "API error: #{msg}"
            end

            final_result = event["data"] if event["type"] == "result" && event["data"]

            # Yield every parsed event so caller can update DB progressively
            on_event&.call(event)
          rescue JSON::ParserError => e
            Rails.logger.warn("[SSE] Failed to parse line: #{line} — #{e.message}")
          end
        end
      end
    end

    raise ApiError, error_message if error_detected
    raise ApiError, "SSE stream ended without result" if final_result.nil?

    final_result
  end

  # POST /v5/analyze_{section_type} — JSON response
  def analyze(section_type, report)
    endpoint = "/v5/analyze_#{section_type}"
    body = build_analyze_body(report)

    response = connection(timeout: ANALYZE_TIMEOUT).post(endpoint) do |req|
      req.headers["Content-Type"] = "application/json"
      req.headers["User-Agent"]   = "MemoryAI-Worker/1.0"
      req.body = body.to_json
    end

    raise ApiError, "Analyze API #{response.status} for #{section_type}: #{response.body}" unless response.success?

    JSON.parse(response.body)
  end

  private

  def connection(timeout:)
    Faraday.new(url: @base_url) do |f|
      f.request :authorization, :basic, @user, @pass
      f.options.timeout = timeout
      f.options.open_timeout = 30
      f.adapter Faraday.default_adapter
    end
  end

  # Streaming connection for SSE — uses Net::HTTP on_data callback
  def streaming_connection(timeout:)
    Faraday.new(url: @base_url) do |f|
      f.request :authorization, :basic, @user, @pass
      f.options.timeout = timeout
      f.options.open_timeout = 30
      f.adapter :net_http
    end
  end

  def build_search_body(report)
    {
      scenario: {
        user_query: report.user_query,
        user_context: report.user_context || "",
        scenario_name: report.scenario_name,
        scenario_description: report.scenario_description || ""
      },
      technologies: report.technologies || [],
      language: "Japanese"
    }
  end

  def build_analyze_body(report)
    {
      scenario: {
        user_query: report.user_query,
        user_context: report.user_context || "",
        scenario_name: report.scenario_name,
        scenario_description: report.scenario_description || ""
      },
      technologies: report.technologies || [],
      articles: report.articles || [],
      patents: report.patents || [],
      markets: report.markets || [],
      language: "Japanese"
    }
  end
end
