class ScenarioReportSection < ApplicationRecord
  self.table_name = "scenario_report_sections"

  belongs_to :report,
             class_name: "ScenarioReport",
             foreign_key: "report_id"

  def mark_running!
    update!(
      status: "running",
      error_message: nil,
      progress: 0,
      updated_at: Time.current
    )
  end

  def mark_done!(data_col, data)
    update!(
      status: "done",
      data_col => data,
      progress: 100,
      updated_at: Time.current
    )
  end

  def mark_error!(msg)
    update!(
      status: "error",
      error_message: msg.to_s.truncate(1000),
      updated_at: Time.current
    )
  end
end
