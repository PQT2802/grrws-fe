import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  {
    ignores: [
      "**/node_modules/**",
      ".next/**",
      "dist/**",
      "coverage/**",
      "**/*.log",
      "public/generated/**",
    ],
  },
  // Next.js core + TS
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // Optional: relax noisy rules you listed (uncomment if desired)
      // "react/no-unescaped-entities": "off",
      // "react-hooks/exhaustive-deps": "warn",
      // "@next/next/no-img-element": "warn",
    },
  },
];

export default config;
