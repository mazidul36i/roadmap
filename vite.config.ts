/// <reference types="vitest/config" />
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import * as path from "node:path";

const src = (dir: string) => path.resolve(import.meta.dirname, "./src", dir);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@app": src("app"),
      "@ui": src("ui"),
      "@features": src("features"),
      "@content": src("content"),
      "@styles": src("styles"),
      "@components": src("components"),
      "@context": src("context"),
      "@data": src("data"),
      "@lib": src("lib"),
      "@pages": src("pages"),
      "@app-types": src("types"),
      "@ai-contract": path.resolve(import.meta.dirname, "./functions/src/contract.ts"),
    }
  },
  // Pre-bundle at startup so lazily-imported features never hit a stale
  // optimizer cache ("504 Outdated Optimize Dep") in development.
  optimizeDeps: {
    include: [
      "radix-ui",
      "cmdk",
      "react-markdown",
      "remark-gfm",
      "prism-react-renderer",
      "prismjs/components/prism-java",
      "prismjs/components/prism-kotlin",
      "prismjs/components/prism-typescript",
      "prismjs/components/prism-bash",
      "prismjs/components/prism-yaml",
      "prismjs/components/prism-docker",
      "prismjs/components/prism-properties",
      "firebase/functions",
      "ts-fsrs",
      "canvas-confetti",
    ],
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
})
