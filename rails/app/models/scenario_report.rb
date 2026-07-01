class ScenarioReport < ApplicationRecord
  self.table_name = "scenario_reports"

  has_many :sections,
           class_name: "ScenarioReportSection",
           foreign_key: "report_id",
           dependent: :destroy

  ANALYSIS_SECTIONS = %w[trl market social_issue technical_competitors].freeze
  DERIVED_SECTIONS  = %w[research_landscape market_implementations executive_summary].freeze
  ALL_SECTIONS      = (ANALYSIS_SECTIONS + DERIVED_SECTIONS).freeze

  def all_analysis_done?
    sections.where(section_type: ANALYSIS_SECTIONS, status: "done").count == ANALYSIS_SECTIONS.size
  end

  def all_sections_done?
    sections.where(status: "done").count == ALL_SECTIONS.size
  end

  def any_section_error?
    sections.where(status: "error").exists?
  end
end
