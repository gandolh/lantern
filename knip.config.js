import preset from "./vendor/house-style/knip.json" with { type: "json" };

// knip has no `extends`, so this spreads the house preset. The unused dependency below is expected
// for now (2026-11-11): the page declares Base UI before any component imports it. When the first
// wrapper under web/src/components/ui/ imports it, this entry goes.
export default {
  ...preset,
  workspaces: { web: { ignoreDependencies: ["@base-ui/react"] } },
};
