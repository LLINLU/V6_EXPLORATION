/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	trailingSlash: true,
	skipTrailingSlashRedirect: true,

	eslint: {
		ignoreDuringBuilds: true,
	},

	async rewrites() {
		return {
			beforeFiles: [],

			afterFiles: [
				{
					source:
						"/:path*",

					destination:
						"/",
				},
			],

			fallback: [],
		}
	},
}

export default nextConfig