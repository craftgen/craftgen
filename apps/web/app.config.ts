// import preserveDirectives from "rollup-preserve-directives";
// import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";
import { defineConfig } from "@tanstack/start/config";
import react from "@vitejs/plugin-react";
import Unfonts from "unplugin-fonts/vite";

import tsConfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

export default defineConfig({
  resolve: {
    alias: {
      "@craftgen/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@craftgen/core": path.resolve(__dirname, "../../packages/core/src"),
    },
  },  
  vite: {

    plugins: () => [
      // preserveDirectives(),
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      // react({
      //   jsxRuntime: "automatic",
      //   include: ["@craftgen/ui", "@craftgen/core"],
      // }),
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
