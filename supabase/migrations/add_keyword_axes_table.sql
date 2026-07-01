-- Multi-Axis Keyword System table
-- Stores exploration axes and keywords for query refinement

CREATE TABLE keyword_axes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID REFERENCES technology_trees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),

  -- Query and axes data
  query TEXT NOT NULL,
  axes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name, description, keywords[]}
  selected_keywords JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of selected keywords

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_keyword_axes_tree_id ON keyword_axes(tree_id);
CREATE INDEX idx_keyword_axes_user_id ON keyword_axes(user_id);
CREATE INDEX idx_keyword_axes_team_id ON keyword_axes(team_id);
CREATE INDEX idx_keyword_axes_query ON keyword_axes(query);

-- Trigger for updated_at
CREATE TRIGGER update_keyword_axes_updated_at
BEFORE UPDATE ON keyword_axes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies
ALTER TABLE keyword_axes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can perform all operations on their own keyword axes"
ON keyword_axes FOR ALL
USING ((auth.uid() = user_id) OR is_app_admin(auth.uid()));

-- Grant permissions
GRANT ALL ON keyword_axes TO authenticated;
GRANT ALL ON keyword_axes TO service_role;
