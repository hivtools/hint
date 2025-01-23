import { cfg } from "../vitest.config";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";

export default mergeConfig(
    cfg,
    defineConfig({
        test: {
            environment: "jsdom",
            include: ['**/*.{itest,ispec}.?(c|m)[jt]s?(x)'],
            globals: true,
            maxConcurrency: 4,
            exclude: [...configDefaults.exclude, "**/adr-dataset.itest.ts"],
            coverage: { provider: "v8", reportsDirectory: "./coverage/integration/" },
            testTimeout: 6000,
            setupFiles: ["./tests/setup.integration.ts"]
        }
    })
);
