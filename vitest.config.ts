import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["__tests__/**/*.test.ts"],
    // Le pool "forks" (défaut) se fige en deadlock IPC sur certaines machines
    // (macOS sous pression mémoire). "threads" est fiable et rend `npm test`
    // utilisable en local comme en CI.
    pool: "threads",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
