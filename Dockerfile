# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy manifests first so Docker caches the install layer
COPY package.json package-lock.json ./

# Install ALL deps (dev deps needed for tsc)
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy manifests and install PRODUCTION deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Create the uploads directory (needs to exist at runtime)
RUN mkdir -p uploads/agent-kyc uploads/dealer-kyc uploads/banners uploads/products

# Copy bundled public asset uploads that already exist in the repo
COPY uploads/banners ./seed-uploads/banners
COPY uploads/products ./seed-uploads/products

# Copy the public admin panel
COPY public ./public
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Do NOT copy .env — secrets must be injected by the container platform at runtime.
# dotenv.config() will silently skip loading if .env is absent; process.env values
# set by the platform are already present before the app starts.

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
