import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

// `eslint-config-next` (15.5.x) still ships eslintrc-style config only, so it is
// bridged into ESLint 9's flat config through FlatCompat — the same shape
// create-next-app generates. Without a config file on disk, `next lint` drops
// into an interactive setup prompt and fails in CI.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  {
    ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts", "scripts/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
