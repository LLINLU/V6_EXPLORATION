class SseConsumer
  # Parse an SSE response body and extract the final "result" event data.
  # Mirrors the Edge Function's consumeSSE() logic.
  #
  # NOTE: No longer used by SearchApiClient (which now streams via on_data).
  # Kept as a utility for non-streaming SSE parsing if needed.
  #
  # @param body [String] raw SSE response body
  # @return [Hash] parsed result data
  def self.extract_result(body)
    final_result = nil

    body.each_line do |line|
      trimmed = line.strip
      next unless trimmed.start_with?("data: ")

      json_str = trimmed[6..]
      begin
        event = JSON.parse(json_str)

        if event["type"] == "error"
          message = event["message_en"].presence || event["message_ja"] || "Unknown SSE error"
          raise SearchApiClient::ApiError, "API error: #{message}"
        end

        if event["type"] == "result" && event["data"]
          final_result = event["data"]
        end
      rescue JSON::ParserError => e
        Rails.logger.warn("[SSE] Failed to parse line: #{trimmed} — #{e.message}")
      end
    end

    raise SearchApiClient::ApiError, "SSE stream ended without result" if final_result.nil?

    final_result
  end
end
