// Database Connection Test Script
// Run this in browser console or as a standalone script to test your Supabase connection

import { supabase } from "./src/integrations/supabase/client.js"

async function testDatabaseConnection() {
	console.log("Testing Supabase connection...")

	try {
		// Test basic connection
		const { data, error } = await supabase
			.from("technology_trees")
			.select("count")
			.limit(1)

		if (error) {
			console.error("❌ Database Error:", error.message)

			if (error.message.includes("does not exist")) {
				console.log("📝 Action Required:")
				console.log(
					"1. Go to https://supabase.com/dashboard/project/ukqcklsmzajgumwfihnu/sql/new",
				)
				console.log("2. Copy and paste the content from apply_migration.sql")
				console.log('3. Click "Run" to create the required tables')
			}
			return false
		}

		console.log("✅ Database connection successful!")
		console.log("📊 Tables are accessible")
		return true
	} catch (err) {
		console.error("❌ Connection failed:", err)
		return false
	}
}

// Test Edge Functions
async function testEdgeFunctions() {
	console.log("Testing Edge Functions...")

	try {
		const { data, error } = await supabase.functions.invoke("generate-tree", {
			body: { searchTheme: "test" },
		})

		if (error) {
			console.error("❌ Edge Function Error:", error)
			return false
		}

		console.log("✅ Edge Functions accessible!")
		return true
	} catch (err) {
		console.error("❌ Edge Function test failed:", err)
		return false
	}
}

export { testDatabaseConnection, testEdgeFunctions }
