const swaggerDoc = {
	openapi: "3.0.0",
	info: { title: "Memory AI BE API", version: "0.1.0" },
	components: {
		securitySchemes: {
			userId: {
				type: "apiKey",
				in: "header",
				name: "x-user-id",
			},
			sourceIp: {
				type: "apiKey",
				in: "header",
				name: "x-source-ip",
				description:
					"Injected by API Gateway from `$context.identity.sourceIp` in production (IPv4 or IPv6). For local-direct BE calls, set NEXT_PUBLIC_DEV_SOURCE_IP on the FE (non-production builds only).",
			},
		},
		schemas: {
			Error: {
				type: "object",
				properties: {
					error: { type: "string" },
				},
			},
			CodeError: {
				type: "object",
				properties: {
					code: { type: "string", example: "FORBIDDEN" },
					reason: { type: "string", nullable: true },
				},
			},
			IpRestrictedError: {
				type: "object",
				properties: {
					code: { type: "string", enum: ["IP_RESTRICTED"] },
				},
			},
			IpAllowlistEntry: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" },
					cidr: {
						type: "string",
						example: "203.0.113.0/24",
						description:
							"IPv4 or IPv6 CIDR. Bare host IPs are accepted and normalized to /32 (IPv4) or /128 (IPv6).",
					},
					description: { type: "string", nullable: true, example: "本社オフィス" },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			IpAllowlistBulkAddResult: {
				type: "object",
				properties: {
					results: {
						type: "array",
						items: {
							type: "object",
							properties: {
								userId: { type: "string", format: "uuid" },
								outcome: { type: "string", enum: ["added", "skipped"] },
							},
						},
					},
				},
			},
			IpAllowlistBulkDeleteResult: {
				type: "object",
				properties: {
					results: {
						type: "array",
						items: {
							type: "object",
							properties: {
								userId: { type: "string", format: "uuid" },
								outcome: { type: "string", enum: ["deleted", "not_found"] },
							},
						},
					},
				},
			},
			ScenarioStatus: {
				type: "object",
				properties: {
					scenario_id: { type: "string", format: "uuid" },
					job_id: { type: "string", format: "uuid", nullable: true },
					status: {
						type: "string",
						enum: ["done", "running", "queued", "failed", "not_found"],
						example: "running",
					},
					progress: {
						type: "string",
						nullable: true,
						example: "Step 3 of 8",
					},
					data: {
						type: "object",
						description:
							"Full report payload when status is 'done', empty object otherwise",
					},
					message: {
						type: "string",
						example: "Report generation is in progress",
					},
				},
			},
			QueryReportStatus: {
				type: "object",
				properties: {
					query_id: { type: "string", format: "uuid" },
					job_id: { type: "string", format: "uuid", nullable: true },
					status: {
						type: "string",
						enum: ["done", "running", "queued", "failed", "not_found"],
						example: "running",
					},
					progress: { type: "string", nullable: true },
					job_created_at: { type: "string", format: "date-time", nullable: true },
					job_updated_at: { type: "string", format: "date-time", nullable: true },
					job_elapsed_sec: { type: "integer", nullable: true },
					data: {
						type: "object",
						description:
							"Full report payload (s01–s07) when status is 'done', empty object otherwise",
					},
					message: {
						type: "string",
						example: "Report generation is in progress",
					},
				},
			},
		},
	},
	paths: {
		"/health": {
			get: {
				tags: ["Health"],
				summary: "Health check",
				responses: {
					"200": {
						description: "Server is healthy",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										status: { type: "string", example: "ok" },
									},
								},
							},
						},
					},
				},
			},
		},
		"/scenario-report": {
			post: {
				tags: ["Scenario Report"],
				summary: "Enqueue a scenario report generation job",
				security: [{ userId: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: [
									"theme",
									"scenario_title",
									"scenario_description",
									"scenario_id",
								],
								properties: {
									theme: { type: "string", example: "Aerial Haptics" },
									scenario_title: {
										type: "string",
										example: "Non-contact rehab device",
									},
									scenario_description: {
										type: "string",
										example: "Using ultrasonic arrays for stroke rehab",
									},
									scenario_id: {
										type: "string",
										format: "uuid",
										example: "123e4567-e89b-12d3-a456-426614174000",
									},
									language: { type: "string", example: "Japanese" },
								},
							},
						},
					},
				},
				responses: {
					"201": {
						description: "Job queued",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										job_id: { type: "string", format: "uuid" },
										status: { type: "string", example: "queued" },
									},
								},
							},
						},
					},
					"400": {
						description: "Invalid request body",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: { type: "string" },
										details: { type: "array", items: { type: "object" } },
									},
								},
							},
						},
					},
					"409": {
						description:
							"Report already being generated — returns existing job_id",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										job_id: { type: "string", format: "uuid" },
										status: { type: "string", example: "running" },
										error: {
											type: "string",
											example:
												"A report is already being generated for this scenario.",
										},
									},
								},
							},
						},
					},
					"429": {
						description: "Monthly report limit reached",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: { type: "string" },
										used: { type: "integer" },
										limit: { type: "integer" },
									},
								},
							},
						},
					},
					"500": {
						description: "Internal server error",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/me": {
			get: {
				tags: ["Me"],
				summary: "Authenticated bootstrap — returns userId and observed source IP",
				description:
					"Used by the frontend on app load to verify the session AND trigger the per-user IP allowlist check. Returns 403 IP_RESTRICTED when the caller's source IP is not in their allowlist.",
				security: [{ userId: [], sourceIp: [] }],
				responses: {
					"200": {
						description: "Authenticated, source IP allowed",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										userId: { type: "string", format: "uuid" },
										sourceIp: {
											type: "string",
											nullable: true,
											example: "203.0.113.10",
										},
									},
								},
							},
						},
					},
					"401": {
						description: "Missing or invalid X-User-Id",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"403": {
						description: "Source IP not in the caller's allowlist",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/IpRestrictedError" },
							},
						},
					},
					"500": {
						description: "Internal server error (e.g. X-Source-IP header missing)",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
				},
			},
		},
		"/users/{userId}/ip-allowlist": {
			get: {
				tags: ["IP Allowlist"],
				summary: "List a user's IP allowlist entries (admin-only)",
				security: [{ userId: [], sourceIp: [] }],
				parameters: [
					{
						name: "userId",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
				],
				responses: {
					"200": {
						description: "Allowlist entries (may be empty)",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										items: {
											type: "array",
											items: { $ref: "#/components/schemas/IpAllowlistEntry" },
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Invalid userId format",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
					"403": {
						description: "Not an admin (FORBIDDEN) or IP-restricted",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
				},
			},
			post: {
				tags: ["IP Allowlist"],
				summary: "Add an IP allowlist entry for a user (admin-only)",
				security: [{ userId: [], sourceIp: [] }],
				parameters: [
					{
						name: "userId",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["cidr"],
								properties: {
									cidr: { type: "string", example: "203.0.113.0/24" },
									description: { type: "string", nullable: true, example: "本社オフィス" },
								},
							},
						},
					},
				},
				responses: {
					"201": {
						description: "Entry created",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/IpAllowlistEntry" },
							},
						},
					},
					"400": {
						description:
							"Invalid CIDR (INVALID_CIDR with `reason`), invalid path, or invalid body",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
					"403": {
						description: "Not an admin (FORBIDDEN) or IP-restricted",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
					"409": {
						description: "Duplicate (user_id, cidr)",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
				},
			},
		},
		"/users/{userId}/ip-allowlist/{id}": {
			delete: {
				tags: ["IP Allowlist"],
				summary: "Delete an IP allowlist entry (admin-only)",
				description:
					"The `userId` in the path must own the entry; mismatches collapse to 404 so cross-user ids are not leaked.",
				security: [{ userId: [], sourceIp: [] }],
				parameters: [
					{
						name: "userId",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
				],
				responses: {
					"204": { description: "Deleted" },
					"400": {
						description: "Invalid path parameter",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
					"403": {
						description: "Not an admin (FORBIDDEN) or IP-restricted",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
					"404": {
						description: "Entry not found, or belongs to a different user",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
				},
			},
		},
		"/ip-allowlist/bulk": {
			post: {
				tags: ["IP Allowlist"],
				summary: "Bulk-add the same CIDR to many users (admin-only)",
				description:
					"Inserts the same (cidr, description) pair for every userId in one round-trip. Existing rows are reported as `skipped` (not errored).",
				security: [{ userId: [], sourceIp: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["userIds", "cidr"],
								properties: {
									userIds: {
										type: "array",
										items: { type: "string", format: "uuid" },
										minItems: 1,
										maxItems: 1000,
									},
									cidr: {
										type: "string",
										example: "203.0.113.0/24",
										description:
											"IPv4 or IPv6 CIDR. Bare hosts normalize to /32 (v4) or /128 (v6).",
									},
									description: {
										type: "string",
										nullable: true,
										example: "本社オフィス",
									},
								},
							},
						},
					},
				},
				responses: {
					"200": {
						description: "Per-user outcomes",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/IpAllowlistBulkAddResult",
								},
							},
						},
					},
					"400": {
						description: "Invalid CIDR or body",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
					"403": {
						description: "Not an admin or IP-restricted",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
				},
			},
		},
		"/ip-allowlist/bulk-delete": {
			post: {
				tags: ["IP Allowlist"],
				summary:
					"Bulk-delete the same CIDR from many users' allowlists (admin-only)",
				description:
					"POST (not DELETE) so the body survives proxies that strip DELETE bodies. Matches against the normalized CIDR; missing rows are reported as `not_found`.",
				security: [{ userId: [], sourceIp: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["userIds", "cidr"],
								properties: {
									userIds: {
										type: "array",
										items: { type: "string", format: "uuid" },
										minItems: 1,
										maxItems: 1000,
									},
									cidr: {
										type: "string",
										example: "203.0.113.0/24",
										description:
											"IPv4 or IPv6 CIDR (same normalization as bulk add).",
									},
								},
							},
						},
					},
				},
				responses: {
					"200": {
						description: "Per-user outcomes",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/IpAllowlistBulkDeleteResult",
								},
							},
						},
					},
					"400": {
						description: "Invalid CIDR or body",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
					"403": {
						description: "Not an admin or IP-restricted",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
				},
			},
		},
		"/ip-allowlist/by-users": {
			post: {
				tags: ["IP Allowlist"],
				summary:
					"Fetch allowlist entries for many users in one round-trip (admin-only)",
				description:
					"Fetches allowlist entries for many users in one round-trip — used by the team-aggregate UI. Uses POST because team rosters may exceed query-string length limits. Users with no entries are present in the response as `[]` so callers don't disambiguate missing vs empty.",
				security: [{ userId: [], sourceIp: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["userIds"],
								properties: {
									userIds: {
										type: "array",
										items: { type: "string", format: "uuid" },
										minItems: 1,
										maxItems: 1000,
									},
								},
							},
						},
					},
				},
				responses: {
					"200": {
						description: "Entries keyed by user_id (empty array for users with no entries)",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										entriesByUser: {
											type: "object",
											additionalProperties: {
												type: "array",
												items: {
													$ref: "#/components/schemas/IpAllowlistEntry",
												},
											},
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Invalid body",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
					"403": {
						description: "Not an admin or IP-restricted",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
				},
			},
		},
		"/ip-allowlist/summary": {
			get: {
				tags: ["IP Allowlist"],
				summary: "Per-user entry counts across all users (admin-only)",
				description:
					"Aggregate endpoint backing the admin dashboard so the FE doesn't N+1 the per-user endpoint. Users with 0 entries are omitted from the response — clients should treat absent ids as 0.",
				security: [{ userId: [], sourceIp: [] }],
				responses: {
					"200": {
						description: "Counts keyed by user_id",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										counts: {
											type: "object",
											additionalProperties: { type: "integer", example: 3 },
											example: {
												"00000000-0000-0000-0000-000000000001": 2,
												"00000000-0000-0000-0000-000000000002": 1,
											},
										},
									},
								},
							},
						},
					},
					"403": {
						description: "Not an admin or IP-restricted",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CodeError" },
							},
						},
					},
				},
			},
		},
		"/scenario-report/{id}": {
			get: {
				tags: ["Scenario Report"],
				summary:
					"Poll scenario report status — done, running, queued, failed, or not_found",
				security: [{ userId: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
						description: "Scenario UUID",
					},
				],
				responses: {
					"200": {
						description:
							"Scenario report status. The `status` field drives how the client should react.",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ScenarioStatus" },
								examples: {
									done: {
										summary: "Report is ready",
										value: {
											scenario_id: "123e4567-e89b-12d3-a456-426614174000",
											job_id: "abc12345-0000-0000-0000-000000000001",
											status: "done",
											progress: null,
											data: {
												theme: "Aerial Haptics",
												scenario: "...",
												summary: "...",
											},
											message: "Report is ready",
										},
									},
									running: {
										summary: "Generation in progress",
										value: {
											scenario_id: "123e4567-e89b-12d3-a456-426614174000",
											job_id: "abc12345-0000-0000-0000-000000000002",
											status: "running",
											progress: "Step 3 of 8",
											data: {},
											message: "Report generation is in progress",
										},
									},
									queued: {
										summary: "Job is waiting in queue",
										value: {
											scenario_id: "123e4567-e89b-12d3-a456-426614174000",
											job_id: "abc12345-0000-0000-0000-000000000003",
											status: "queued",
											progress: null,
											data: {},
											message: "Report generation is queued",
										},
									},
									failed: {
										summary: "Last job failed",
										value: {
											scenario_id: "123e4567-e89b-12d3-a456-426614174000",
											job_id: "abc12345-0000-0000-0000-000000000004",
											status: "failed",
											progress: "Error: LLM timeout on step 4",
											data: {},
											message: "Error: LLM timeout on step 4",
										},
									},
									not_found: {
										summary: "No report or job exists",
										value: {
											scenario_id: "123e4567-e89b-12d3-a456-426614174000",
											job_id: null,
											status: "not_found",
											progress: null,
											data: {},
											message: "No report or job found for this scenario",
										},
									},
								},
							},
						},
					},
					"500": {
						description: "Internal server error",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/query-report": {
			post: {
				tags: ["Query Report"],
				summary: "Start a query report generation job",
				security: [{ userId: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["query_id", "query", "language"],
								properties: {
									query_id: {
										type: "string",
										format: "uuid",
										example: "123e4567-e89b-12d3-a456-426614174000",
									},
									query: {
										type: "string",
										example: "Solid-State Batteries",
									},
									language: {
										type: "string",
										example: "Japanese",
									},
								},
							},
						},
					},
				},
				responses: {
					"201": {
						description: "Report generation started",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										job_id: { type: "string", format: "uuid" },
										status: { type: "string", example: "queued" },
									},
								},
							},
						},
					},
					"400": {
						description: "Invalid request body",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: { type: "string" },
										details: { type: "array", items: { type: "object" } },
									},
								},
							},
						},
					},
					"409": {
						description: "Report already being generated for this query",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										job_id: { type: "string", format: "uuid" },
										status: { type: "string", example: "running" },
										error: {
											type: "string",
											example:
												"A report is already being generated for this query.",
										},
									},
								},
							},
						},
					},
					"429": {
						description: "Monthly report limit reached",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: { type: "string" },
										used: { type: "integer" },
										limit: { type: "integer" },
									},
								},
							},
						},
					},
					"500": {
						description: "Internal server error",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/query-report/{id}": {
			get: {
				tags: ["Query Report"],
				summary:
					"Poll query report status — done, running, queued, failed, or not_found",
				security: [{ userId: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
						description: "Query UUID",
					},
				],
				responses: {
					"200": {
						description:
							"Query report status. Poll until status is 'done' to get the full report.",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/QueryReportStatus" },
								examples: {
									done: {
										summary: "Report is ready",
										value: {
											query_id: "123e4567-e89b-12d3-a456-426614174000",
											job_id: "abc12345-0000-0000-0000-000000000001",
											status: "done",
											progress: null,
											job_created_at: "2024-01-15T10:00:00Z",
											job_updated_at: "2024-01-15T10:04:30Z",
											job_elapsed_sec: null,
											data: {
												theme: "Solid-State Batteries",
												summary: "...",
												s01: {},
												s02: {},
											},
											message: "Report is ready",
										},
									},
									running: {
										summary: "Generation in progress",
										value: {
											query_id: "123e4567-e89b-12d3-a456-426614174000",
											job_id: "abc12345-0000-0000-0000-000000000002",
											status: "running",
											progress: "generate",
											job_created_at: "2024-01-15T10:00:00Z",
											job_updated_at: "2024-01-15T10:01:00Z",
											job_elapsed_sec: 60,
											data: {},
											message: "Report generation is in progress",
										},
									},
									queued: {
										summary: "Job is starting",
										value: {
											query_id: "123e4567-e89b-12d3-a456-426614174000",
											job_id: "abc12345-0000-0000-0000-000000000003",
											status: "queued",
											progress: null,
											job_created_at: "2024-01-15T10:00:00Z",
											job_updated_at: "2024-01-15T10:00:00Z",
											job_elapsed_sec: 2,
											data: {},
											message: "Report generation is queued",
										},
									},
									failed: {
										summary: "Generation failed",
										value: {
											query_id: "123e4567-e89b-12d3-a456-426614174000",
											job_id: "abc12345-0000-0000-0000-000000000004",
											status: "failed",
											progress: "Report generation failed. Please try again.",
											job_created_at: "2024-01-15T10:00:00Z",
											job_updated_at: "2024-01-15T10:05:00Z",
											job_elapsed_sec: 300,
											data: {},
											message: "Report generation failed. Please try again.",
										},
									},
									not_found: {
										summary: "No report or job exists",
										value: {
											query_id: "123e4567-e89b-12d3-a456-426614174000",
											job_id: null,
											status: "not_found",
											progress: null,
											job_created_at: null,
											job_updated_at: null,
											job_elapsed_sec: null,
											data: {},
											message: "No report or job found for this query",
										},
									},
								},
							},
						},
					},
					"500": {
						description: "Internal server error",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
	},
}

export default swaggerDoc
