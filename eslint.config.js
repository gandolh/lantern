import { houseStyle } from "./vendor/house-style/eslint.config.js";

/**
 * The house config from the vendored house-style copy, given Lantern's folders. Thin on purpose: the
 * compiler is the first gate, and the house adds only what it cannot see. The rules and the reason
 * for each are in the copy.
 */
export default [
  ...houseStyle({
    root: import.meta.dirname,
    web: "web/src",
    // better-tailwindcss reads the page's one stylesheet for its classes: an unknown or deprecated class is an error,
    // and so is a class string out of Tailwind's order.
    tailwind: { css: "web/src/styles/index.css", order: true },
    server: "server/src",
    // Allowed to print: the server entry logs before its logger exists, and the seed, the title
    // import and the source check talk to the person running them.
    console: [
      "server/src/server.ts",
      "server/src/seed.ts",
      "server/src/features/sources/check.ts",
      "server/src/features/pool/cli.ts",
    ],
    tests: ["**/*.test.{ts,tsx}", "server/src/testing.ts", "server/src/features/sources/testing.ts"],
    playwright: ["web/e2e/**/*.spec.ts"],
    ignores: ["data/**"],
  }),
];
