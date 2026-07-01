import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders })
	}

	try {
		// Create a Supabase client with the service role key
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

		// Get the authorization header from the request
		const authHeader = req.headers.get("Authorization")!
		const token = authHeader.replace("Bearer ", "")

		// Verify the user's token and get user info
		const {
			data: { user },
			error: authError,
		} = await supabaseAdmin.auth.getUser(token)

		if (authError || !user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}

		// Check if user is admin using the is-app-admin function
		const { data: adminCheck, error: adminError } =
			await supabaseAdmin.functions.invoke("is-app-admin", {
				body: { userId: user.id },
			})

		if (adminError || !adminCheck?.isAdmin) {
			return new Response(
				JSON.stringify({ error: "Insufficient permissions" }),
				{
					status: 403,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		// Parse request body
		const { email, password, username, teamId, role } = await req.json()

		if (!email || !password || !username || !teamId || !role) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		// Create user with Admin API (email confirmation not required)
		const { data: newUser, error: createError } =
			await supabaseAdmin.auth.admin.createUser({
				email: email,
				password: password,
				email_confirm: true, // Automatically confirm email
				user_metadata: {
					username: username,
				},
			})

		if (createError) {
			return new Response(JSON.stringify({ error: createError.message }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}

		const userId = newUser.user?.id
		if (!userId) {
			return new Response(JSON.stringify({ error: "Failed to get user ID" }), {
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}

		// Create user profile
		const { error: profileError } = await supabaseAdmin
			.from("user_profiles")
			.insert([
				{
					id: userId,
					username: username,
				},
			])

		if (profileError) {
			console.error("Profile creation failed:", profileError)
			// Continue even if profile creation fails
		}

		// Create team membership
		const { error: memberError } = await supabaseAdmin
			.from("teams_members")
			.insert([
				{
					user_id: userId,
					team_id: teamId,
					role: role,
				},
			])

		if (memberError) {
			console.error("Team membership creation failed:", memberError)

			// If team membership fails, clean up the created user
			await supabaseAdmin.auth.admin.deleteUser(userId)

			return new Response(
				JSON.stringify({ error: "Failed to create team membership" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		return new Response(
			JSON.stringify({
				success: true,
				user: {
					id: userId,
					email: email,
					username: username,
				},
			}),
			{
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		)
	} catch (error) {
		console.error("Error:", error)
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	}
})
