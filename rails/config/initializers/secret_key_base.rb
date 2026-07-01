# Worker-only app: use env var for secret_key_base (no credentials file needed)
Rails.application.config.secret_key_base = ENV.fetch("SECRET_KEY_BASE") {
  if Rails.env.production?
    raise "SECRET_KEY_BASE must be set in production"
  else
    "dev-secret-key-base-not-for-production-use-only-for-local-development-minimum-length"
  end
}
