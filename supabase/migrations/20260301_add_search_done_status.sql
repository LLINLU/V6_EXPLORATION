-- Add 'search_done' status to scenario_reports for frontend orchestration.
-- After search completes, the frontend triggers analysis sections.
ALTER TABLE public.scenario_reports
  DROP CONSTRAINT scenario_reports_status_check,
  ADD CONSTRAINT scenario_reports_status_check
    CHECK (status IN ('pending','searching','search_done','analyzing','done','error'));
