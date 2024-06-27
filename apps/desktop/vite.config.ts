import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react";
import preserveDirectives from "rollup-preserve-directives";
import Unfonts from "unplugin-fonts/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  build: {
    sourcemap: true, // Source map generation must be turned on for Sentry to work
  },
  plugins: [
    preserveDirectives(),
    react(),
    TanStackRouterVite(),
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

  resolve: {
    alias: {
      "@craftgen/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@craftgen/core": path.resolve(__dirname, "../../packages/core/src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
