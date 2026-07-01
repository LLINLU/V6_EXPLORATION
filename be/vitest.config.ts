import { defineConfig } from "vitest/config"

export default defineConfig({
	// Stop Vite from walking up to the repo-root postcss.config.js,
	// which is scoped to the frontend (requires tailwindcss that be/ doesn't install).
	css: { postcss: { plugins: [] } },
	test: {
		environment: "node",
		include: ["src/**/*.test.ts", "test/**/*.test.ts"],
		// Stub the env vars that src/config/env.ts validates at module-load time.
		// Without these, importing any module that transitively touches logger.ts
		// or db/pool.ts (i.e. nearly everything) throws during test collection.
		// These are placeholders — no test should rely on them for behavior.
		//
		// `ANTHROPIC_API_KEY` honors the shell env if exported, so devs/CI with
		// a real key can run the model-compat tests in test/modelTest/* against
		// the live Anthropic API; otherwise those tests will fail with 401 and
		// the rest still pass.
		env: {
			NODE_ENV: "test",
			APP_ENV: "dev",
			PORT: "3001",
			LOG_LEVEL: "silent",
			CORS_ORIGIN: "http://localhost",
			ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test",
			SQS_QUEUE_URL: "http://localhost/queue",
			AWS_REGION: "ap-northeast-1",
			FREE_MONTHLY_REPORT_LIMIT: "5",
			UNLIMITED_USER_IDS: "",
			DATABASE_URL:
				process.env.DATABASE_URL ??
				"postgresql://memory_ai:memory_ai@localhost:5432/memory_ai",
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.test.ts", "src/db/migrate.ts"],
		},
	},
})
