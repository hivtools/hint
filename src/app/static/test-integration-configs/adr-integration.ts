import {defineConfig, mergeConfig} from "vitest/config";
import vitestConfig from "../vitest.config.ts";

export default defineConfig(configEnv => mergeConfig(
    vitestConfig(configEnv),
    defineConfig({
        test: {
            include: ["**/adr-dataset.itest.ts"],
            testTimeout: 120000,
            setupFiles: ["./src/tests/setup.integration.ts"]
        }
    })
));
