import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for the planner's pure engines (procurement, etc.). Node env —
// these modules are DOM-free.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
