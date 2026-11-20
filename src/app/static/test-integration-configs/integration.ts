import {defineConfig, mergeConfig} from "vitest/config";
import vitestConfig from "../vitest.config.ts";

export default defineConfig(configEnv => mergeConfig(
    vitestConfig(configEnv),
    defineConfig({
        test: {
            include: ["**/*.{itest,ispec}.?(c|m)[jt]s?(x)"],
            exclude: ["**/adr-dataset.itest.ts"],
            coverage: {reportsDirectory: "./coverage/integration/"},
            testTimeout: 6000,
            setupFiles: ["./src/tests/setup.integration.ts"]
        }
    })
));
