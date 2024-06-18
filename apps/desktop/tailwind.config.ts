import web from "@acme/tailwind-config/web";
import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  // We need to append the path to the UI package to the content array so that
  // those classes are included correctly.
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/composer/src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [web],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist, sans-serif", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
      },
    },
  },
} satisfies Config;
