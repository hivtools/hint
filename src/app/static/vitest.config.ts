import {fileURLToPath} from "node:url";
import {configDefaults, defineConfig, mergeConfig} from "vitest/config";
import viteConfig from "./vite.config.ts";

// vite.config.ts exports a function (the config depends on the command), so this config is a function too.
export default defineConfig(configEnv => mergeConfig(
    viteConfig(configEnv),
    defineConfig({
        test: {
            environment: "jsdom",
            globals: true,
            maxConcurrency: 4,
            setupFiles: ["./src/tests/setup.ts"],
            exclude: [...configDefaults.exclude, "src/tests/e2e/**"],
            root: fileURLToPath(new URL("./", import.meta.url)),
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
        }
    })
));
