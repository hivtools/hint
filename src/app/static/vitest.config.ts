import {configDefaults, mergeConfig, defineConfig as testConfig} from 'vitest/config';
import {defineConfig} from 'vite';
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export const cfg = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
});

const testCfg = testConfig({
  test: {
    environment: "jsdom",
    globals: true,
    maxConcurrency: 4,
    setupFiles: [
      './tests/setup.ts'
    ],
    exclude: [
        ...configDefaults.exclude,
        "**/tests/e2e/**/*",
        "**/tests/integration/**/*",
    ],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/unit",
      include: ["src"]
    },
    environmentOptions: {
      jsdom: {
        url: "http://localhost"
      }
    }
  }
});

export default mergeConfig(cfg, testCfg);
