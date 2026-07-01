export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "13.0.5"
	}
	graphql_public: {
		Tables: {
			[_ in never]: never
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			graphql: {
				Args: {
					extensions?: Json
					operationName?: string
					query?: string
					variables?: Json
				}
				Returns: Json
			}
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	public: {
		Tables: {
			node_marketinfo: {
				Row: {
					created_at: string | null
					hist_data: Json | null
					id: string
					market_trl: Json | null
					node_id: string
					paper_trl: Json | null
					statistics: Json | null
					team_id: string | null
					tree_id: string
					updated_at: string | null
					user_id: string | null
				}
				Insert: {
					created_at?: string | null
					hist_data?: Json | null
					id?: string
					market_trl?: Json | null
					node_id: string
					paper_trl?: Json | null
					statistics?: Json | null
					team_id?: string | null
					tree_id: string
					updated_at?: string | null
					user_id?: string | null
				}
				Update: {
					created_at?: string | null
					hist_data?: Json | null
					id?: string
					market_trl?: Json | null
					node_id?: string
					paper_trl?: Json | null
					statistics?: Json | null
					team_id?: string | null
					tree_id?: string
					updated_at?: string | null
					user_id?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "node_marketinfo_node_id_fkey"
						columns: ["node_id"]
						isOneToOne: false
						referencedRelation: "tree_nodes"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "node_marketinfo_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "node_marketinfo_tree_id_fkey"
						columns: ["tree_id"]
						isOneToOne: false
						referencedRelation: "technology_trees"
						referencedColumns: ["id"]
					},
				]
			}
			node_papers: {
				Row: {
					abstract: string
					authors: string
					citations: number
					created_at: string
					date: string | null
					doi: string | null
					id: string
					journal: string
					node_id: string
					region: string
					score: number | null
					tags: Json
					team_id: string | null
					title: string
					tree_id: string
					updated_at: string
					url: string | null
					user_id: string | null
				}
				Insert: {
					abstract: string
					authors: string
					citations?: number
					created_at?: string
					date?: string | null
					doi?: string | null
					id: string
					journal: string
					node_id: string
					region: string
					score?: number | null
					tags?: Json
					team_id?: string | null
					title: string
					tree_id: string
					updated_at?: string
					url?: string | null
					user_id?: string | null
				}
				Update: {
					abstract?: string
					authors?: string
					citations?: number
					created_at?: string
					date?: string | null
					doi?: string | null
					id?: string
					journal?: string
					node_id?: string
					region?: string
					score?: number | null
					tags?: Json
					team_id?: string | null
					title?: string
					tree_id?: string
					updated_at?: string
					url?: string | null
					user_id?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "node_papers_node_id_fkey"
						columns: ["node_id"]
						isOneToOne: false
						referencedRelation: "tree_nodes"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "node_papers_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "node_papers_tree_id_fkey"
						columns: ["tree_id"]
						isOneToOne: false
						referencedRelation: "technology_trees"
						referencedColumns: ["id"]
					},
				]
			}
			node_papers_summary: {
				Row: {
					created_at: string
					id: string
					node_id: string
					papers_count: number
					query: string
					summary: string
					team_id: string | null
					tree_id: string
					updated_at: string
					user_id: string | null
				}
				Insert: {
					created_at?: string
					id?: string
					node_id: string
					papers_count?: number
					query: string
					summary: string
					team_id?: string | null
					tree_id: string
					updated_at?: string
					user_id?: string | null
				}
				Update: {
					created_at?: string
					id?: string
					node_id?: string
					papers_count?: number
					query?: string
					summary?: string
					team_id?: string | null
					tree_id?: string
					updated_at?: string
					user_id?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "node_papers_summary_node_id_fkey"
						columns: ["node_id"]
						isOneToOne: true
						referencedRelation: "tree_nodes"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "node_papers_summary_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "node_papers_summary_tree_id_fkey"
						columns: ["tree_id"]
						isOneToOne: false
						referencedRelation: "technology_trees"
						referencedColumns: ["id"]
					},
				]
			}
			node_use_cases: {
				Row: {
					company: string[]
					created_at: string
					description: string
					id: string
					node_id: string
					press_releases: string[]
					product: string
					team_id: string | null
					tree_id: string
					updated_at: string
					user_id: string | null
					year: number | null
				}
				Insert: {
					company?: string[]
					created_at?: string
					description: string
					id: string
					node_id: string
					press_releases?: string[]
					product: string
					team_id?: string | null
					tree_id: string
					updated_at?: string
					user_id?: string | null
					year?: number | null
				}
				Update: {
					company?: string[]
					created_at?: string
					description?: string
					id?: string
					node_id?: string
					press_releases?: string[]
					product?: string
					team_id?: string | null
					tree_id?: string
					updated_at?: string
					user_id?: string | null
					year?: number | null
				}
				Relationships: [
					{
						foreignKeyName: "node_use_cases_node_id_fkey"
						columns: ["node_id"]
						isOneToOne: false
						referencedRelation: "tree_nodes"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "node_use_cases_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "node_use_cases_tree_id_fkey"
						columns: ["tree_id"]
						isOneToOne: false
						referencedRelation: "technology_trees"
						referencedColumns: ["id"]
					},
				]
			}
			node_usecases_summary: {
				Row: {
					created_at: string
					id: string
					node_id: string
					query: string
					summary: string
					team_id: string | null
					tree_id: string
					updated_at: string
					usecases_count: number
					user_id: string | null
				}
				Insert: {
					created_at?: string
					id?: string
					node_id: string
					query: string
					summary: string
					team_id?: string | null
					tree_id: string
					updated_at?: string
					usecases_count?: number
					user_id?: string | null
				}
				Update: {
					created_at?: string
					id?: string
					node_id?: string
					query?: string
					summary?: string
					team_id?: string | null
					tree_id?: string
					updated_at?: string
					usecases_count?: number
					user_id?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "node_usecases_summary_node_id_fkey"
						columns: ["node_id"]
						isOneToOne: true
						referencedRelation: "tree_nodes"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "node_usecases_summary_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "node_usecases_summary_tree_id_fkey"
						columns: ["tree_id"]
						isOneToOne: false
						referencedRelation: "technology_trees"
						referencedColumns: ["id"]
					},
				]
			}
			project_trees: {
				Row: {
					position: number
					project_id: string
					tree_id: string
				}
				Insert: {
					position?: number
					project_id: string
					tree_id: string
				}
				Update: {
					position?: number
					project_id?: string
					tree_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "project_trees_project_id_fkey"
						columns: ["project_id"]
						isOneToOne: false
						referencedRelation: "projects"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "project_trees_tree_id_fkey"
						columns: ["tree_id"]
						isOneToOne: false
						referencedRelation: "technology_trees"
						referencedColumns: ["id"]
					},
				]
			}
			projects: {
				Row: {
					created_at: string
					creator_id: string
					description: string | null
					id: string
					name: string
					team_id: string | null
					updated_at: string
					visibility: string
				}
				Insert: {
					created_at?: string
					creator_id: string
					description?: string | null
					id?: string
					name: string
					team_id?: string | null
					updated_at?: string
					visibility: string
				}
				Update: {
					created_at?: string
					creator_id?: string
					description?: string | null
					id?: string
					name?: string
					team_id?: string | null
					updated_at?: string
					visibility?: string
				}
				Relationships: [
					{
						foreignKeyName: "projects_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
				]
			}
			saved_papers: {
				Row: {
					id: string
					is_active: boolean
					node_id: string
					notes: string | null
					paper_id: string
					saved_at: string
					team_id: string | null
					tree_id: string
					user_id: string
				}
				Insert: {
					id?: string
					is_active?: boolean
					node_id: string
					notes?: string | null
					paper_id: string
					saved_at?: string
					team_id?: string | null
					tree_id: string
					user_id: string
				}
				Update: {
					id?: string
					is_active?: boolean
					node_id?: string
					notes?: string | null
					paper_id?: string
					saved_at?: string
					team_id?: string | null
					tree_id?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "saved_papers_paper_id_fkey"
						columns: ["paper_id"]
						isOneToOne: false
						referencedRelation: "node_papers"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "saved_papers_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
				]
			}
			saved_use_cases: {
				Row: {
					id: string
					is_active: boolean
					node_id: string
					notes: string | null
					saved_at: string
					team_id: string | null
					tree_id: string
					use_case_id: string
					user_id: string
				}
				Insert: {
					id?: string
					is_active?: boolean
					node_id: string
					notes?: string | null
					saved_at?: string
					team_id?: string | null
					tree_id: string
					use_case_id: string
					user_id: string
				}
				Update: {
					id?: string
					is_active?: boolean
					node_id?: string
					notes?: string | null
					saved_at?: string
					team_id?: string | null
					tree_id?: string
					use_case_id?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "saved_use_cases_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "saved_use_cases_use_case_id_fkey"
						columns: ["use_case_id"]
						isOneToOne: false
						referencedRelation: "node_use_cases"
						referencedColumns: ["id"]
					},
				]
			}
			teams: {
				Row: {
					created_at: string | null
					created_by: string | null
					description: string | null
					id: string
					name: string
					privacy_setting: boolean
					updated_at: string | null
				}
				Insert: {
					created_at?: string | null
					created_by?: string | null
					description?: string | null
					id?: string
					name: string
					privacy_setting?: boolean
					updated_at?: string | null
				}
				Update: {
					created_at?: string | null
					created_by?: string | null
					description?: string | null
					id?: string
					name?: string
					privacy_setting?: boolean
					updated_at?: string | null
				}
				Relationships: []
			}
			teams_members: {
				Row: {
					joined_at: string
					role: string
					team_id: string
					user_id: string
				}
				Insert: {
					joined_at?: string
					role?: string
					team_id: string
					user_id: string
				}
				Update: {
					joined_at?: string
					role?: string
					team_id?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "teams_members_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
				]
			}
			technology_trees: {
				Row: {
					created_at: string
					description: string | null
					id: string
					last_viewed_at: string | null
					layer_config: Json | null
					mode: string | null
					name: string
					reasoning: string | null
					scenario_inputs: Json | null
					search_theme: string
					team_id: string | null
					updated_at: string
					user_id: string | null
				}
				Insert: {
					created_at?: string
					description?: string | null
					id?: string
					last_viewed_at?: string | null
					layer_config?: Json | null
					mode?: string | null
					name: string
					reasoning?: string | null
					scenario_inputs?: Json | null
					search_theme: string
					team_id?: string | null
					updated_at?: string
					user_id?: string | null
				}
				Update: {
					created_at?: string
					description?: string | null
					id?: string
					last_viewed_at?: string | null
					layer_config?: Json | null
					mode?: string | null
					name?: string
					reasoning?: string | null
					scenario_inputs?: Json | null
					search_theme?: string
					team_id?: string | null
					updated_at?: string
					user_id?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "technology_trees_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
				]
			}
			tree_nodes: {
				Row: {
					axis: Database["public"]["Enums"]["axis_type"]
					children_count: number | null
					created_at: string
					description: string | null
					id: string
					level: number
					name: string
					node_order: number | null
					parent_id: string | null
					path: string | null
					team_id: string | null
					tree_id: string | null
					updated_at: string
					user_id: string | null
				}
				Insert: {
					axis: Database["public"]["Enums"]["axis_type"]
					children_count?: number | null
					created_at?: string
					description?: string | null
					id: string
					level: number
					name: string
					node_order?: number | null
					parent_id?: string | null
					path?: string | null
					team_id?: string | null
					tree_id?: string | null
					updated_at?: string
					user_id?: string | null
				}
				Update: {
					axis?: Database["public"]["Enums"]["axis_type"]
					children_count?: number | null
					created_at?: string
					description?: string | null
					id?: string
					level?: number
					name?: string
					node_order?: number | null
					parent_id?: string | null
					path?: string | null
					team_id?: string | null
					tree_id?: string | null
					updated_at?: string
					user_id?: string | null
				}
				Relationships: [
					{
						foreignKeyName: "tree_nodes_parent_id_fkey"
						columns: ["parent_id"]
						isOneToOne: false
						referencedRelation: "tree_nodes"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "tree_nodes_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "tree_nodes_tree_id_fkey"
						columns: ["tree_id"]
						isOneToOne: false
						referencedRelation: "technology_trees"
						referencedColumns: ["id"]
					},
				]
			}
			user_profiles: {
				Row: {
					created_at: string | null
					id: string
					updated_at: string | null
					username: string
				}
				Insert: {
					created_at?: string | null
					id: string
					updated_at?: string | null
					username: string
				}
				Update: {
					created_at?: string | null
					id?: string
					updated_at?: string | null
					username?: string
				}
				Relationships: []
			}
			user_release_views: {
				Row: {
					created_at: string
					id: string
					release_id: string
					user_id: string
					viewed_at: string
				}
				Insert: {
					created_at?: string
					id?: string
					release_id: string
					user_id: string
					viewed_at?: string
				}
				Update: {
					created_at?: string
					id?: string
					release_id?: string
					user_id?: string
					viewed_at?: string
				}
				Relationships: []
			}
		}
		Views: {
			v_user_details: {
				Row: {
					created_at: string | null
					email: string | null
					role: string | null
					team_id: string | null
					team_name: string | null
					updated_at: string | null
					user_id: string | null
					username: string | null
				}
				Relationships: [
					{
						foreignKeyName: "teams_members_team_id_fkey"
						columns: ["team_id"]
						isOneToOne: false
						referencedRelation: "teams"
						referencedColumns: ["id"]
					},
				]
			}
		}
		Functions: {
			get_user_team_trees_and_nodes: {
				Args: { user_id: string }
				Returns: {
					node_description: string
					node_id: string
					node_level: number
					node_name: string
					node_order: number
					team_id: string
					team_name: string
					tree_description: string
					tree_id: string
					tree_name: string
				}[]
			}
			get_user_technology_tree_data: {
				Args: { user_id: string }
				Returns: {
					node_description: string
					node_id: string
					node_level: number
					node_name: string
					node_order: number
					tree_description: string
					tree_id: string
					tree_name: string
				}[]
			}
			is_app_admin: { Args: { uid: string }; Returns: boolean }
		}
		Enums: {
			axis_type:
				| "Root"
				| "Scenario"
				| "Purpose"
				| "Function"
				| "Measure"
				| "Measure2"
				| "Measure3"
				| "Measure4"
				| "Measure5"
				| "Measure6"
				| "Measure7"
				| "Technology"
				| "How1"
				| "How2"
				| "How3"
				| "How4"
				| "How5"
				| "How6"
				| "How7"
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R
			}
			? R
			: never
		: never

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I
			}
			? I
			: never
		: never

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U
			}
			? U
			: never
		: never

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			axis_type: [
				"Root",
				"Scenario",
				"Purpose",
				"Function",
				"Measure",
				"Measure2",
				"Measure3",
				"Measure4",
				"Measure5",
				"Measure6",
				"Measure7",
				"Technology",
				"How1",
				"How2",
				"How3",
				"How4",
				"How5",
				"How6",
				"How7",
			],
		},
	},
} as const
