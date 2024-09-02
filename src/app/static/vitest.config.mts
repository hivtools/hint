import {configDefaults, defineConfig} from 'vitest/config';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    maxConcurrency: 4,
    setupFiles: [
      './src/tests/setup.ts'
    ],
    exclude: [
        ...configDefaults.exclude,
        "./src/tests/e2e/*"
    ],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/unit",
      include: ["src/app"]
    },
    environmentOptions: {
      jsdom: {
        url: "http://localhost"
      }
    }
  },
  plugins: [vue()],
});
