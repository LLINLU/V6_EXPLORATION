class DerivedSectionBuilder
  # Build research_landscape section from search results
  def self.build_research_landscape(report)
    articles = report.articles || []
    patents  = report.patents || []

    {
      "articleCommentary"  => "#{articles.size}件の論文が見つかりました。",
      "articleYearlyData"  => build_yearly_data(articles),
      "patentCommentary"   => "#{patents.size}件の特許が見つかりました。",
      "patentYearlyData"   => build_patent_yearly_data(patents),
      "topJournals"        => build_top_journals(articles)
    }
  end

  # Build market_implementations section from search results
  def self.build_market_implementations(report)
    markets = report.markets || []

    markets.map do |m|
      company = if m["company"].is_a?(Array)
                  m["company"].join(", ").presence || "Unknown"
                elsif m["company"].present?
                  m["company"].to_s
                elsif m["publisher"].present?
                  m["publisher"].to_s
                else
                  "Unknown"
                end

      {
        "product"     => m["product"] || m["title"] || "Unknown",
        "company"     => company,
        "stage"       => m["stage"] || "commercial",
        "description" => m["description"] || m["summary"] || "",
        "urls"        => m["press_releases"] || m["urls"] || [],
        "year"        => extract_year(m)
      }
    end
  end

  # Build executive_summary section from analysis results + search results
  def self.build_executive_summary(report, analysis_sections)
    findings    = []
    market_rows = []
    research_rows = []

    # TRL findings
    trl_data = analysis_sections["trl"]
    if trl_data
      if trl_data.dig("raw", "report", "final_summary")
        findings << trl_data["raw"]["report"]["final_summary"]
      elsif trl_data.dig("table", "rows")&.any?
        rows = trl_data["table"]["rows"]
        avg_trl = rows.sum { |r| r["integrated_trl"].to_f } / rows.size
        level = avg_trl >= 7 ? "高い" : avg_trl >= 4 ? "中程度" : "初期段階"
        findings << "平均TRLスコアは#{avg_trl.round(1)}であり、技術成熟度は#{level}水準です。"
      end
    end

    # Market findings
    market_data = analysis_sections["market"]
    if market_data
      findings << market_data.dig("data", "summary") if market_data.dig("data", "summary")

      if market_data.dig("data", "tam_value")
        market_rows << { "index" => 1, "label" => "TAM (Total Addressable Market)", "value" => market_data["data"]["tam_value"] }
      end
      if market_data.dig("data", "sam_value")
        market_rows << { "index" => 2, "label" => "SAM (Serviceable Addressable Market)", "value" => market_data["data"]["sam_value"] }
      end
      if market_data.dig("data", "cagr")
        market_rows << { "index" => 3, "label" => "CAGR", "value" => market_data["data"]["cagr"] }
      end
    end

    # Research stats
    articles = report.articles || []
    patents  = report.patents || []
    markets  = report.markets || []

    research_rows << { "index" => 1, "label" => "論文数",     "value" => "#{articles.size}件" }
    research_rows << { "index" => 2, "label" => "特許数",     "value" => "#{patents.size}件" }
    research_rows << { "index" => 3, "label" => "市場事例数", "value" => "#{markets.size}件" }

    # Social issue findings
    social_data = analysis_sections["social_issue"]
    if social_data&.dig("raw", "solutions")&.any?
      findings << "#{social_data["raw"]["solutions"].size}件の社会課題ソリューションが特定されました。"
    end

    {
      "narrative"    => findings.any? ? findings.join("\n\n") : "分析結果に基づくエグゼクティブサマリーです。",
      "findings"     => findings.any? ? findings : ["分析結果を取得中です。"],
      "marketRows"   => market_rows.any? ? market_rows : [{ "index" => 1, "label" => "市場データ", "value" => "分析中" }],
      "researchRows" => research_rows
    }
  end

  # ── Private helpers ──

  def self.extract_year(item)
    return item["year"] if item["year"].is_a?(Integer)
    return item["publication_year"] if item["publication_year"].is_a?(Integer)

    if item["date"].is_a?(String)
      parsed = item["date"][0, 4].to_i
      return parsed if parsed > 1900 && parsed < 2100
    end

    nil
  end

  def self.build_yearly_data(items)
    year_map = Hash.new(0)
    items.each do |item|
      year = extract_year(item)
      year_map[year] += 1 if year
    end
    year_map.map { |y, c| { "year" => y, "count" => c } }.sort_by { |e| e["year"] }
  end

  def self.build_patent_yearly_data(patents)
    year_map = Hash.new(0)
    patents.each do |patent|
      year = extract_year(patent)
      year ||= patent["filing_year"] if patent["filing_year"].is_a?(Integer)
      year_map[year] += 1 if year
    end
    year_map.map { |y, c| { "year" => y, "count" => c } }.sort_by { |e| e["year"] }
  end

  def self.build_top_journals(articles)
    journal_map = Hash.new(0)
    articles.each do |article|
      journal = [article["journal"], article["publisher"], article["source"]]
                  .map { |v| v.to_s.strip.presence }
                  .compact
                  .first
      journal_map[journal] += 1 if journal
    end
    journal_map
      .map { |name, count| { "name" => name, "count" => count } }
      .sort_by { |e| -e["count"] }
      .first(10)
  end

  private_class_method :extract_year, :build_yearly_data, :build_patent_yearly_data, :build_top_journals
end
