FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json .npmrc* ./
# `--ignore-scripts` blocks postinstall hooks of any dependency at install
# time. None of our prod deps need their lifecycle scripts to function, so
# skipping them removes a class of supply-chain attack vectors.
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS production
RUN apk add --no-cache tini
WORKDIR /app
COPY package*.json .npmrc* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/src/db/migrations ./dist/db/migrations
COPY --chown=appuser:appgroup global-bundle.pem ./

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

USER appuser
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
