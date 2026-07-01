// supabase/functions/is-app-admin/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
}

const supabase = createClient(
	Deno.env.get("SUPABASE_URL")!,
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
)

// ✅ 環境変数から ADMIN_TEAM_ID を取得
const ADMIN_TEAM_ID = Deno.env.get("ADMIN_TEAM_ID")

if (!ADMIN_TEAM_ID) {
	throw new Error("Missing ADMIN_TEAM_ID environment variable")
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders })
	}

	try {
		const { userId } = await req.json()

		if (!userId) {
			return new Response(JSON.stringify({ error: "Missing userId" }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}

		const { data, error } = await supabase
			.from("teams_members")
			.select("user_id")
			.eq("team_id", ADMIN_TEAM_ID)
			.eq("user_id", userId)
			.maybeSingle()

		if (error) {
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}

		const isAdmin = !!data

		return new Response(JSON.stringify({ isAdmin }), {
			status: 200,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	} catch (err) {
		return new Response(
			JSON.stringify({ error: "Server error", detail: err.message }),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		)
	}
})
