import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "server-only",
        replacement: fileURLToPath(new URL("./tests/mocks/server-only.ts", import.meta.url)),
      },
      { find: /^@\//, replacement: root },
    ],
  },
  test: {
    environment: "node",
    include: ["app/api/**/*.emulator.e2e.ts"],
    maxWorkers: 1,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    restoreMocks: true,
  },
});
