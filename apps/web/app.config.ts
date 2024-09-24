import { fileURLToPath } from "node:url";
// import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";
import { defineConfig } from "@tanstack/start/config";
import react from "@vitejs/plugin-react";
import preserveDirectives from "rollup-preserve-directives";
import Unfonts from "unplugin-fonts/vite";
import { config } from "vinxi/plugins/config";
import tsConfigPaths from "vite-tsconfig-paths";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // get the name of the directory

export default defineConfig({
  vite: {
    plugins: () => [
      config("user", {
        resolve: {
          alias: {
            "@craftgen/ui": path.resolve(__dirname, "../../packages/ui/src"),
            "@craftgen/core": path.resolve(
              __dirname,
              "../../packages/core/src",
            ),
            "@craftgen/composer": path.resolve(
              __dirname,
              "../../packages/composer/src",
            ),
          },
        },
      }),
      react({
        jsxRuntime: "automatic",
        include: ["@craftgen/ui", "@craftgen/composer", "@craftgen/core"],
      }),
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
      // sentryVitePlugin({
      //   authToken: process.env.SENTRY_AUTH_TOKEN,
      //   org: "craftgen",
      //   project: "desktop",

      //   disable: process.env.NODE_ENV === "development",
      // }),
    ],
  },
});
