#!/usr/bin/env bash
# Ensures the GTE-large embedding GGUF is cached locally, for
# scripts/build-mcp-index.ts. A cached copy is re-verified against the checksum
# below every run (a couple of seconds), so a corrupt or swapped file is never
# trusted just because it is already on disk.
#
# Fetched by direct URL rather than through QVAC's own registry, whose P2P
# download does not reliably traverse CI networking — the same reason
# mcp-embedder.ts loads the model by file path.
#
# Nothing in the site build needs this. Only the "Build MCP search index"
# workflow and `npm run mcp:index` do.
set -euo pipefail

# Same source + checksum QVAC's own registry uses for GTE_LARGE_FP16 (see
# tetherto/qvac's generated models_registry.py) — fetched directly since the
# registry's own P2P download doesn't reliably traverse container networking.
EMBED_GGUF_DEFAULT="$HOME/.qvac/models/8441c7419e66033f_gte-large_fp16.gguf"
EMBED_GGUF_URL="https://huggingface.co/ChristianAzinn/gte-large-gguf/resolve/f9fa5479908e72c2a8b9d6ba112911cd1e51be53/gte-large_fp16.gguf"
EMBED_GGUF_SHA256="939f1fb3fcc70f2a250a7e7ad7c2fbdc1397d46f9a8055d053e451829c5293fb"

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  else
    shasum -a 256 "$1" | cut -d' ' -f1
  fi
}

if [ -z "${QVAC_EMBED_GGUF:-}" ] && [ -f "$EMBED_GGUF_DEFAULT" ] \
  && [ "$(sha256_of "$EMBED_GGUF_DEFAULT")" != "$EMBED_GGUF_SHA256" ]; then
  echo "Cached embedding model fails its checksum — discarding it."
  rm -f "$EMBED_GGUF_DEFAULT"
fi

if [ -z "${QVAC_EMBED_GGUF:-}" ] && [ ! -f "$EMBED_GGUF_DEFAULT" ]; then
  echo "No embedding model cached — fetching GTE-large (~670MB)..."
  mkdir -p "$(dirname "$EMBED_GGUF_DEFAULT")"
  tmp_gguf="${EMBED_GGUF_DEFAULT}.partial"
  # --retry-all-errors, not just --retry: a plain --retry only retries curl's
  # own idea of a transient failure, which excludes a connection reset
  # mid-transfer — exactly the failure a stalled 670MB download is likeliest
  # to hit. --max-time bounds the whole attempt so a hung connection can't
  # wedge the job past its cache-miss budget.
  curl -fL --retry 3 --retry-all-errors --retry-delay 5 \
    --connect-timeout 20 --max-time 900 --no-progress-meter \
    -o "$tmp_gguf" "$EMBED_GGUF_URL"
  actual_sha256="$(sha256_of "$tmp_gguf")"
  if [ "$actual_sha256" != "$EMBED_GGUF_SHA256" ]; then
    rm -f "$tmp_gguf"
    echo "error: GTE-large checksum mismatch (got $actual_sha256, expected $EMBED_GGUF_SHA256)" >&2
    exit 1
  fi
  mv "$tmp_gguf" "$EMBED_GGUF_DEFAULT"
fi
