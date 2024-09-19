// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from "vite-plugin-dts";
import pkg from './package.json' assert { type: 'json' }


export default defineConfig({
  plugins: [react(), dts()], 
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/editor.tsx'),
      formats: ['es'], // pure ESM package
      name: 'Composer',
      // the proper extensions will be added
      fileName: 'composer',
    },
    rollupOptions: {
      external: [
        ...Object.keys(pkg.dependencies), // don't bundle dependencies
        /^node:.*/, // don't bundle built-in Node.js modules (use protocol imports!)
      ],
    },
    target: 'esnext',
  },
})