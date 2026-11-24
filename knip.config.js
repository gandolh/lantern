import preset from "./vendor/house-style/knip.json" with { type: "json" };

// knip has no `extends`, so this spreads the house preset. design/ holds the redesign board's
// reference copy (tokens, sketches), never imported by the app.
export default { ...preset, ignore: [...preset.ignore, "design/**"] };
