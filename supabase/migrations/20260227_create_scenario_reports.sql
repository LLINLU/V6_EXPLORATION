-- Scenario Reports: stores report generation state and raw search results
CREATE TABLE public.scenario_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id TEXT NOT NULL,
    tree_id UUID NOT NULL,
    scenario_name TEXT NOT NULL,
    scenario_description TEXT,
    user_query TEXT NOT NULL,
    user_context TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','searching','analyzing','done','error')),
    error_message TEXT,
    search_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (search_status IN ('pending','running','done','error')),
    articles JSONB DEFAULT '[]'::jsonb,
    patents JSONB DEFAULT '[]'::jsonb,
    markets JSONB DEFAULT '[]'::jsonb,
    technologies JSONB DEFAULT '[]'::jsonb,
    team_id UUID,
    user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scenario Report Sections: per-section analysis status and results
CREATE TABLE public.scenario_report_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES scenario_reports(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL
        CHECK (section_type IN (
            'trl','market','social_issue','technical_competitors',
            'executive_summary','research_landscape','market_implementations'
        )),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','running','done','error')),
    error_message TEXT,
    progress INTEGER DEFAULT 0,
    raw_data JSONB,
    transformed_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(report_id, section_type)
);

CREATE INDEX idx_scenario_reports_tree_scenario ON scenario_reports(tree_id, scenario_id);
CREATE INDEX idx_report_sections_report_id ON scenario_report_sections(report_id);
