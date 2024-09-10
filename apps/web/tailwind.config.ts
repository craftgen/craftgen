import web from "@acme/tailwind-config/web";
import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
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
