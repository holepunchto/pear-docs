# ---------------------------------------------------------------------------
# Debian slim, NOT Alpine. onnxruntime-node ships glibc prebuilds only; on musl
# the addon loads and then dies at dlopen with a symbol error that reads like a
# missing file. There is no musl build to switch to.
# ---------------------------------------------------------------------------
ARG NODE_VERSION=22-slim

# --- deps -------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# CUDA prebuilds are ~1 GB and useless on a CPU pod.
ENV npm_config_onnxruntime_node_install_cuda=skip
RUN npm ci --no-audit --no-fund

# --- builder ----------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vendor the encoder so the runtime never calls out to huggingface.co. Runs
# before `next build` because outputFileTracingIncludes copies models/ into the
# standalone output.
ARG EMBED_MODEL=bge-small
ARG EMBED_DTYPE=q8
ENV EMBED_MODEL=${EMBED_MODEL} EMBED_DTYPE=${EMBED_DTYPE}
RUN npm run fetch:model

# data/index.json + data/pages.json are committed artifacts (see README —
# building them needs a docs checkout, which this image does not have). Fail
# early and clearly rather than shipping an image that 503s on every request.
RUN test -s data/index.json && test -s data/pages.json \
    || (echo "✖ data/index.json or data/pages.json missing — run 'npm run build:index' and commit them" && exit 1)

# BUILD_STANDALONE is what switches on `output: 'standalone'` (see
# next.config.mjs) — the self-contained server.js this image copies out below.
ENV NEXT_TELEMETRY_DISABLED=1 BUILD_STANDALONE=1
RUN npm run build

# --- runner -----------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=8787

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# The standalone bundle already carries the traced node_modules (including the
# platform ONNX runtime and its shared library — see outputFileTracingIncludes
# in next.config.mjs), the vendored model and the prebuilt index.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8787

# Liveness only: /api/health returns 503 until the index and encoder have loaded,
# so the platform holds traffic off a pod whose index failed to parse.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
