// import preserveDirectives from "rollup-preserve-directives";
// import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "@tanstack/start/config";
import react from "@vitejs/plugin-react";
import Unfonts from "unplugin-fonts/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  vite: {
    plugins: () => [
      react({
        jsxRuntime: "automatic",
        include: ["@craftgen/ui"],
      }),
      // preserveDirectives(),
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      Unfonts({
        custom: {
          families: [
            {
              name: "Geist",
              src: "./src/assets/fonts/geist/*.woff2",
            },
          ],
        },
      }),
      // sentryVitePlugin({
      //   authToken: process.env.SENTRY_AUTH_TOKEN,
      //   org: "craftgen",
      //   project: "desktop",

      //   disable: process.env.NODE_ENV === "development",
      // }),
    ],
  },
});
