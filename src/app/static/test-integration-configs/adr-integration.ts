import baseConfig from "../vitest.config.ts";
import { mergeConfig, defineConfig } from "vitest/config";

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ["**/adr-dataset.itest.ts"],
            coverage: { reportsDirectory: "./coverage/integration/" },
            testTimeout: 120000,
            setupFiles: ["./src/tests/setup.integration.ts"]
        }
    })
);
