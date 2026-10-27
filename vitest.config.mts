import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // `server-only` throws outside a React Server Component bundle.
      {
        find: "server-only",
        replacement: fileURLToPath(new URL("./tests/mocks/server-only.ts", import.meta.url)),
      },
      { find: /^@\//, replacement: root },
    ],
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "**/*.e2e.ts"],
    restoreMocks: true,
  },
});
