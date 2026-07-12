import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Test source directly so tests don't depend on packages/shared/dist
      // existing (that's a build artifact, not something CI/local should need
      // pre-built just to run the test suite).
      "@health-tracker/shared": path.resolve(__dirname, "packages/shared/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["apps/*/src/**/*.test.ts", "packages/*/src/**/*.test.ts"],
  },
});
