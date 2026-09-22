FROM node:24-alpine AS builder
WORKDIR /repo

COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN npm ci --workspace @organizacion/shared --workspace @organizacion/api --include-workspace-root

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm run build --workspace @organizacion/shared \
  && npm run build --workspace @organizacion/api \
  && npm prune --omit=dev

FROM node:24-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production
ENV NODE_OPTIONS=--disable-warning=ExperimentalWarning

RUN apk add --no-cache wget \
  && addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /repo/node_modules ./node_modules
COPY --from=builder --chown=app:app /repo/package.json ./package.json
COPY --from=builder --chown=app:app /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder --chown=app:app /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=app:app /repo/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=app:app /repo/apps/api/dist ./apps/api/dist

RUN mkdir -p /repo/apps/api/data && chown -R app:app /repo/apps/api/data

USER app
WORKDIR /repo/apps/api
EXPOSE 3333

HEALTHCHECK --interval=20s --timeout=4s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3333/api/health || exit 1

CMD ["node", "dist/server.js"]
