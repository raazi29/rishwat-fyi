# syntax=docker/dockerfile:1
#
# Container image for apps/api (Hono, Node 20, run straight from TypeScript with
# tsx). Build context is the REPOSITORY ROOT, not apps/api:
#
#   docker build -f apps/api/Dockerfile -t rishwat-api .
#
# The context has to be the root because this is an npm-workspaces monorepo: the
# API depends on @rishwat/database and @rishwat/validation, which npm resolves by
# path from the root package.json ("workspaces": ["apps/*", "packages/*"]). Every
# COPY below therefore reproduces the real repository layout inside the image —
# apps/ and packages/ stay separate directories. Flattening them (e.g.
# `COPY apps packages ./`) merges their contents into /app and breaks workspace
# resolution.

# ---------------------------------------------------------------------------
# Stage 1: dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Manifests only, so this layer is cached until a dependency actually changes.
# apps/web's manifest is copied even though the frontend is not part of this
# image: `npm ci` validates package-lock.json against every declared workspace,
# and a missing manifest makes the lockfile look out of date.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/validation/package.json ./packages/validation/

# Install the root plus the API workspace only — apps/web's Next.js toolchain is
# not needed here. devDependencies MUST be installed: the API entrypoint is
# TypeScript and is executed by tsx, which is a devDependency of apps/api.
# (NODE_ENV is left unset in this stage precisely so npm keeps them.)
RUN npm ci --workspace apps/api --include-workspace-root

# ---------------------------------------------------------------------------
# Stage 2: runtime
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# node_modules (root + any nested workspace trees) and the manifests.
COPY --from=deps --chown=node:node /app ./

# Application source. TypeScript is not compiled ahead of time; tsx transpiles on
# load, exactly as `npm run start -w apps/api` does locally.
COPY --chown=node:node apps/api ./apps/api
COPY --chown=node:node packages/database ./packages/database
COPY --chown=node:node packages/validation ./packages/validation

# Only used when EVIDENCE_STORAGE_DRIVER=local (production should use the
# supabase driver — container filesystems are ephemeral). Created up front so
# the /health storage probe can write as the unprivileged user.
RUN mkdir -p /app/data/evidence && chown -R node:node /app/data

USER node

# The server listens on PORT (default 8787); Render injects its own PORT.
ENV PORT=8787
EXPOSE 8787

# `node --import tsx` runs the server in a single process, so SIGTERM from the
# container runtime reaches the graceful-shutdown handler in src/index.ts
# directly — no npm/shell wrapper swallowing the signal.
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
