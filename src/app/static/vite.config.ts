import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'src', 'index.ts'),
      output: {
        entryFileNames: "hint.js",
        assetFileNames: "hint.[ext]",
        chunkFileNames: "chunk.[name].js"
      }
    },
  },
  publicDir: resolve(__dirname, "assets")
})
