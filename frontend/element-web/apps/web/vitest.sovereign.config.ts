/*
 * Sovereign Messenger — Sprint 3, Milestone 3
 * vitest.sovereign.config.ts — Sovereign acceptance and regression suite
 *
 * A dedicated project so the Sovereign suite runs against the Sovereign source
 * alone. The host platform's own test project requires its workspace packages
 * to be built first; depending on that would make the acceptance evidence for
 * this milestone conditional on an unrelated build step.
 *
 * MatrixClientPeg is stubbed: it is the single point where the Sovereign
 * service layer reaches the host platform (Blueprint §6), so stubbing it
 * isolates our code without touching the bridge itself (PRD §6.1).
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
        name: "sovereign",
        environment: "jsdom",
        globals: true,
        include: ["src/sovereign/__tests__/**/*.test.{ts,tsx}"],
        /*
         * The live two-user suite has a homeserver as a precondition and is run
         * deliberately, through vitest.live.config.ts. Included here it failed
         * this suite on every machine without one, which made the offline
         * regression signal unreadable.
         */
        exclude: ["src/sovereign/__tests__/live/**"],
        setupFiles: ["./src/sovereign/__tests__/support/setup.ts"],
        css: false,
        reporters: [["default", { summary: true }]],
    },
});
