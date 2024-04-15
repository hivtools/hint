import baseConfig from "../vitest.config.ts";
import { mergeConfig, defineConfig } from "vitest/config";

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['**/*.{itest,ispec}.?(c|m)[jt]s?(x)'],
            exclude: ["**/adr-dataset.itest.ts"],
            testTimeout: 6000,
            setupFiles: ["./src/tests/setup.integration.ts"]
        }
    })
);
