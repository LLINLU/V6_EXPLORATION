-- v_user_details: joins user_profiles with teams_members and teams.
--
-- In Supabase this view also joins auth.users for the email column.
-- After Cognito migration (Phase 3), email will come from user_profiles
-- or a Cognito lookup. For now we leave email as NULL so the view can
-- be created without depending on auth.users.

CREATE OR REPLACE VIEW public.v_user_details AS
SELECT
    up.id          AS user_id,
    NULL::text     AS email,
    up.username    AS username,
    tm.team_id     AS team_id,
    t.name         AS team_name,
    tm.role        AS role,
    up.created_at  AS created_at,
    up.updated_at  AS updated_at
FROM public.user_profiles up
LEFT JOIN public.teams_members tm ON tm.user_id = up.id
LEFT JOIN public.teams t          ON t.id = tm.team_id;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.is_app_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.teams_members
        WHERE user_id = uid
          AND role = 'admin'
    );
$$;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.get_user_technology_tree_data(p_user_id uuid)
RETURNS TABLE (
    tree_id uuid,
    tree_name text,
    tree_description text,
    node_id text,
    node_name text,
    node_description text,
    node_level integer,
    node_order integer
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        tt.id           AS tree_id,
        tt.name         AS tree_name,
        tt.description  AS tree_description,
        tn.id           AS node_id,
        tn.name         AS node_name,
        tn.description  AS node_description,
        tn.level        AS node_level,
        tn.node_order   AS node_order
    FROM public.technology_trees tt
    JOIN public.tree_nodes tn ON tn.tree_id = tt.id
    WHERE tt.user_id = p_user_id
    ORDER BY tt.name, tn.level, tn.node_order;
$$;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.get_user_team_trees_and_nodes(p_user_id uuid)
RETURNS TABLE (
    team_id uuid,
    team_name text,
    tree_id uuid,
    tree_name text,
    tree_description text,
    node_id text,
    node_name text,
    node_description text,
    node_level integer,
    node_order integer
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        t.id            AS team_id,
        t.name          AS team_name,
        tt.id           AS tree_id,
        tt.name         AS tree_name,
        tt.description  AS tree_description,
        tn.id           AS node_id,
        tn.name         AS node_name,
        tn.description  AS node_description,
        tn.level        AS node_level,
        tn.node_order   AS node_order
    FROM public.teams_members tm
    JOIN public.teams t            ON t.id  = tm.team_id
    JOIN public.technology_trees tt ON tt.team_id = t.id
    JOIN public.tree_nodes tn      ON tn.tree_id = tt.id
    WHERE tm.user_id = p_user_id
    ORDER BY t.name, tt.name, tn.level, tn.node_order;
$$;