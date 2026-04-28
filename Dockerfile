# Override with build-arg when Docker Hub is unreachable, e.g.
# NODE_IMAGE=mirror.gcr.io/library/node:22-bookworm-slim
ARG NODE_IMAGE=node:22-bookworm-slim
FROM ${NODE_IMAGE} AS deps
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

ARG NODE_IMAGE=node:22-bookworm-slim
FROM ${NODE_IMAGE} AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/persona_seq?schema=public"
RUN npx prisma generate
RUN npm run build

ARG NODE_IMAGE=node:22-bookworm-slim
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/docker/entrypoint.sh ./docker/entrypoint.sh
COPY --from=builder /app/docker/seed.mjs ./docker/seed.mjs

RUN chmod +x ./docker/entrypoint.sh \
  && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker/entrypoint.sh"]
