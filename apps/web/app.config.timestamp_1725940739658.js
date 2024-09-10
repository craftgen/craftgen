// app.config.ts
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "@tanstack/start/config";
import preserveDirectives from "rollup-preserve-directives";
import Unfonts from "unplugin-fonts/vite";
import tsConfigPaths from "vite-tsconfig-paths";

var app_config_default = defineConfig({
  vite: {
    plugins: () => [
      preserveDirectives(),
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
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "craftgen",
        project: "desktop",
        // disable: !process.env.GITHUB_SHA,
      }),
    ],
  },
});
export { app_config_default as default };
