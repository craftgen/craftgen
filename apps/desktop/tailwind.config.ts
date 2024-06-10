import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

import web from "@acme/tailwind-config/web";

export default {
  // We need to append the path to the UI package to the content array so that
  // those classes are included correctly.
  content: ["./src/**/*.{ts,tsx}"],
  presets: [web],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
      },
    },
  },
} satisfies Config;
