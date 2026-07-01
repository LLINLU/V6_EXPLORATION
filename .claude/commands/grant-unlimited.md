# Grant Unlimited Plan

Grant one or more users the unlimited scenario report plan in production RDS.

**Usage:** `/grant-unlimited user1@example.com user2@example.com`

## Instructions

The user has provided a space-separated list of email addresses as `$ARGUMENTS`. Grant each of them the unlimited plan by running the following steps.

### Config

```
AWS_PROFILE=memorylab-prd-admin
REGION=ap-northeast-1
ECS_CLUSTER=mlab-prd-memory-ai-ecs-cluster
ECS_SERVICE=mlab-prd-memoryai-backend-service
```

Get the Supabase service role key and URL:
- `SUPABASE_URL` — from SSM: `/prd/memoryai/supabase-project-url`
- `SUPABASE_SERVICE_ROLE_KEY` — run: `npx supabase db query --linked "SELECT current_setting('app.settings.service_role_key', true)"` or check Supabase dashboard

### Step 1 — Look up user IDs from Supabase

For each email in `$ARGUMENTS`, call:

```bash
curl -s "$SUPABASE_URL/auth/v1/admin/users?filter=<email>" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" | jq -r '.users[0].id // "NOT_FOUND"'
```

Print each `email => uuid` pair. Stop if any returns `NOT_FOUND`.

### Step 2 — Get ECS task ARN

```bash
AWS_PROFILE=$AWS_PROFILE aws ecs list-tasks --region $REGION \
  --cluster $ECS_CLUSTER \
  --service-name $ECS_SERVICE \
  --query 'taskArns[0]' --output text
```

### Step 3 — Upsert unlimited plan via ECS exec

Build a base64-encoded Node.js ESM script that:
1. Uses `@aws-sdk/rds-signer` (at `/app/node_modules/@aws-sdk/rds-signer/dist-cjs/index.js`) with the container's env vars (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_REGION`) to generate an IAM auth token
2. Connects to RDS using `pg` (at `/app/node_modules/pg/lib/index.js`) with the CA bundle at `/app/global-bundle.pem`
3. Runs:
```sql
INSERT INTO user_plans (user_id, plan, monthly_report_limit)
SELECT unnest($1::uuid[]), 'unlimited', NULL
ON CONFLICT (user_id) DO UPDATE SET plan = 'unlimited', monthly_report_limit = NULL
RETURNING user_id, plan
```
4. Prints the returned rows as JSON

Run via:
```bash
AWS_PROFILE=$AWS_PROFILE aws ecs execute-command --region $REGION \
  --cluster $ECS_CLUSTER \
  --task "$TASK_ARN" \
  --container memoryai-backend --interactive \
  --command "sh -c 'echo <base64_script> | base64 -d | node --input-type=module'"
```

### Step 4 — Confirm

Print a summary of which users were updated and their new plan.
