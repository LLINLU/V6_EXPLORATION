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
		const { userId, newPassword } = await req.json()

		if (!userId || !newPassword) {
			return new Response(
				JSON.stringify({ error: "Missing userId or newPassword" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
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

		// Check if the user has admin privileges using is-app-admin function
		const { data: adminCheckData, error: adminCheckError } =
			await supabaseAdmin.functions.invoke("is-app-admin", {
				body: { userId: user.id },
			})

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

		if (!adminCheckData?.isAdmin) {
			return new Response(
				JSON.stringify({ error: "Insufficient permissions" }),
				{
					status: 403,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		// Reset the user's password using admin privileges
		const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
			userId,
			{ password: newPassword },
		)

		if (error) {
			console.error("Error resetting password:", error)
			return new Response(
				JSON.stringify({
					error: "Failed to reset password",
					details: error.message,
				}),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		// Log the password reset action
		console.log(`Password reset by admin ${user.id} for user ${userId}`)

		return new Response(
			JSON.stringify({
				success: true,
				message: "Password reset successfully",
				userId: userId,
			}),
			{
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		)
	} catch (error) {
		console.error("Error in admin-reset-password function:", error)
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	}
})
