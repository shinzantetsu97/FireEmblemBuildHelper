import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/FireEmblemBuildHelper/" : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
}));
