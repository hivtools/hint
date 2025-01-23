import { cfg } from "../vitest.config";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";

export default mergeConfig(
    cfg,
    defineConfig({
        test: {
            environment: "jsdom",
            include: ["**/adr-dataset.itest.ts"],
            globals: true,
            maxConcurrency: 4,
            exclude: [...configDefaults.exclude],
            testTimeout: 120000,
            setupFiles: ["./tests/setup.integration.ts"]
        }
    })
);
