import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// onnxruntime-node ships one `onnxruntime_binding.node` per platform, and each
// one dynamically links a SIBLING shared library (libonnxruntime.*.so / .dylib).
// Next's file tracer follows JS requires, so it copies the .node addon and stops
// there — the standalone server then dies at first use with
// "Library not loaded: @rpath/libonnxruntime...". Pull the whole platform
// directory in explicitly.
//
// Scoped to the BUILD platform rather than `bin/**` so the image carries ~34 MB
// (linux/x64) instead of all five platform builds (~210 MB). In a Docker build
// these values are the target platform's, because the build runs inside the
// target container.
const ORT_BIN = `./node_modules/onnxruntime-node/bin/napi-v6/${process.platform}/${process.arch}/**`;

/** @type {import('next').NextConfig} */
const config = {
  // Without this, Next walks up to the repo root (it has its own lockfile — the
  // full QVAC service lives there) and emits `.next/standalone/lite/server.js`,
  // one directory deeper than every deploy script expects. Pin the trace root to
  // this app so the standalone output is flat.
  outputFileTracingRoot: HERE,
  // Standalone output is for the Dockerfile path ONLY, and is off by default.
  //
  // The deployed path is Sevalla's own builder running `next build` + `next
  // start`, where the full node_modules is already present — there, emitting
  // .next/standalone just writes a second, traced copy of those same modules
  // (~150 MB) that nothing ever executes. The Dockerfile sets BUILD_STANDALONE=1,
  // because a self-contained server.js is exactly what makes that image small.
  ...(process.env.BUILD_STANDALONE === '1' ? { output: 'standalone' } : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  // Native addons and the ONNX weights must NOT be bundled by webpack/turbopack:
  // the .node binary can't be traced through a bundle, and transformers.js
  // resolves model files by filesystem path at runtime.
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node', 'sharp'],
  outputFileTracingIncludes: {
    // Only consulted when standalone output is on; harmless otherwise.
    '/api/search': ['./data/**', './models/**', ORT_BIN],
    '/api/health': ['./data/**'],
    '/mcp': ['./data/**', './models/**', ORT_BIN],
  },
};

export default config;
