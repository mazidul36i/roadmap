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
    }
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
})
