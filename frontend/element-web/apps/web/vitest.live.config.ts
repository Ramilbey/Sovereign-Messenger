/*
 * Sovereign Messenger — Sprint 3 acceptance
 * vitest.live.config.ts — two-user acceptance against a live homeserver
 *
 * Separate from the offline suite: these tests need a running server and are
 * therefore run deliberately, not on every change.
 */

import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
    resolve: {
        alias: [
            {
                find: /^\.\.\/\.\.\/MatrixClientPeg$/,
                replacement: resolve(__dirname, "./src/sovereign/__tests__/support/peg-stub.ts"),
            },
        ],
    },
    test: {
        name: "sovereign-live",
        environment: "node",
        globals: true,
        include: ["src/sovereign/__tests__/live/**/*.test.ts"],
        testTimeout: 60000,
        hookTimeout: 60000,
        fileParallelism: false,
        reporters: [["default", { summary: true }]],
    },
});
