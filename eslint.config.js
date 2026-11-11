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
    console: ["server/src/index.ts", "server/src/seed.ts", "server/src/sources/check.ts", "server/src/pool/cli.ts"],
    tests: ["**/*.test.{ts,tsx}", "server/src/testing.ts", "server/src/sources/testing.ts"],
    ignores: ["data/**"],
  }),
  {
    // A warning for now (2026-11-11): these files still read the environment themselves. When the
    // server takes its settings from config.ts, this block goes and the rule is an error again.
    name: "lantern/process-env-warns",
    files: ["server/src/index.ts", "server/src/seed.ts", "server/src/sources/check.ts", "server/src/pool/cli.ts"],
    rules: { "n/no-process-env": "warn" },
  },
];
