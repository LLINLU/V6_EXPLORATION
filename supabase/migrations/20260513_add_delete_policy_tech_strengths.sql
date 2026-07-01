-- Allow authenticated users to delete technical_strengths rows.
-- INSERT and SELECT already have permissive policies; this adds the missing DELETE policy.
CREATE POLICY "allow_delete_all_tech_strengths"
ON "public"."technical_strengths"
FOR DELETE
USING (true);
