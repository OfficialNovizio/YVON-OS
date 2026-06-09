# YVON Orchestrator — standalone agent-engine service.
# Same image runs locally (docker compose up) and on the container host.
FROM node:22-slim AS base
WORKDIR /app

# Install deps (root package.json provides tsx + the shared lib).
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Bring in the shared lib (session engine) + orchestrator source.
COPY lib ./lib
COPY orchestrator ./orchestrator
COPY tsconfig.json ./tsconfig.json

ENV ORCHESTRATOR_PORT=8787
EXPOSE 8787

# tsx runs the TypeScript service directly (no separate build step).
CMD ["npx", "tsx", "orchestrator/server.ts"]
