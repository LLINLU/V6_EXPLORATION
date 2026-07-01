import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
}

const isMissingAuthUserError = (error: unknown) => {
	if (!error || typeof error !== "object") {
		return false
	}

	const typedError = error as {
		message?: string
		status?: number
		code?: string
	}

	return (
		typedError.status === 404 ||
		typedError.code === "user_not_found" ||
		/\b(not found|does not exist|already deleted)\b/i.test(
			typedError.message ?? "",
		)
	)
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders })
	}

	try {
		// Create Supabase Admin client
		const supabaseAdmin = createClient(
			Deno.env.get("SUPABASE_URL") ?? "",
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
			{
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			},
		)

		// Get request body
		const { userId } = await req.json()

		if (!userId) {
			return new Response(JSON.stringify({ error: "Missing userId" }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}

		// Verify the requesting user has admin privileges
		const authHeader = req.headers.get("Authorization")
		if (!authHeader) {
			return new Response(
				JSON.stringify({ error: "No authorization header" }),
				{
					status: 401,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		const token = authHeader.replace("Bearer ", "")
		const {
			data: { user },
			error: authError,
		} = await supabaseAdmin.auth.getUser(token)

		if (authError || !user) {
			return new Response(JSON.stringify({ error: "Invalid authentication" }), {
				status: 401,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}

		// Check if the requesting user has admin privileges by querying teams_members directly
		// (avoids function-to-function auth issues with is-app-admin)
		const adminTeamId = Deno.env.get("ADMIN_TEAM_ID")
		if (!adminTeamId) {
			return new Response(
				JSON.stringify({ error: "Admin team not configured" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		const { data: adminMembership, error: adminCheckError } =
			await supabaseAdmin
				.from("teams_members")
				.select("user_id")
				.eq("team_id", adminTeamId)
				.eq("user_id", user.id)
				.maybeSingle()

		if (adminCheckError) {
			console.error("Admin check error:", adminCheckError)
			return new Response(
				JSON.stringify({ error: "Unable to verify admin permissions" }),
				{
					status: 403,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		if (!adminMembership) {
			return new Response(
				JSON.stringify({ error: "Insufficient permissions" }),
				{
					status: 403,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		// Step 1: Delete from teams_members table
		const { error: memberError } = await supabaseAdmin
			.from("teams_members")
			.delete()
			.eq("user_id", userId)

		if (memberError) {
			console.error("Error deleting team membership:", memberError)
		}

		// Step 2: Delete from user_profiles table
		const { error: profileError } = await supabaseAdmin
			.from("user_profiles")
			.delete()
			.eq("id", userId)

		if (profileError) {
			console.error("Error deleting user profile:", profileError)
		}

		// Step 3: Delete from Supabase Auth using admin privileges
		const { data: deleteData, error: deleteError } =
			await supabaseAdmin.auth.admin.deleteUser(userId)

		if (deleteError) {
			if (isMissingAuthUserError(deleteError)) {
				console.warn(
					`Auth user ${userId} was already missing during deletion; treating as success`,
				)

				return new Response(
					JSON.stringify({
						success: true,
						message: "User was already deleted",
						userId: userId,
					}),
					{
						status: 200,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					},
				)
			}

			console.error("Error deleting user from auth:", deleteError)
			return new Response(
				JSON.stringify({
					error: "Failed to delete user from authentication system",
					details: deleteError.message,
				}),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		// Log the user deletion action
		console.log(`User ${userId} deleted by admin ${user.id}`)

		return new Response(
			JSON.stringify({
				success: true,
				message: "User deleted successfully",
				userId: userId,
			}),
			{
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		)
	} catch (error) {
		console.error("Error in admin-delete-user function:", error)
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	}
})
