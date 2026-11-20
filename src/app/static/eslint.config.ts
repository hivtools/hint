import {globalIgnores} from "eslint/config";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import {defineConfigWithVueTs, vueTsConfigs} from "@vue/eslint-config-typescript";
import pluginPlaywright from "eslint-plugin-playwright";
import pluginVitest from "@vitest/eslint-plugin";

export default defineConfigWithVueTs(
    {
        name: "app/files-to-lint",
        files: ["**/*.{vue,ts,mts,tsx}"]
    },

    // ./public is the build output. The types in generated.d.ts are made by a script.
    globalIgnores(["public/**", "coverage/**", "src/app/generated.d.ts"]),

    // create-vue uses Oxlint for these basic rules. We use only ESLint, so we use the ESLint rules.
    js.configs.recommended,
    ...pluginVue.configs["flat/essential"],
    vueTsConfigs.recommended,

    {
        ...pluginPlaywright.configs["flat/recommended"],
        files: ["src/tests/e2e/**/*.{test,spec}.{js,ts,jsx,tsx}"]
    },

    {
        ...pluginVitest.configs.recommended,
        files: ["src/tests/**/*"],
        ignores: ["src/tests/e2e/**"],
        rules: {
            ...pluginVitest.configs.recommended.rules,
            // Many tests call helper functions that call expect, for example expectTranslated.
            "vitest/expect-expect": ["error", {assertFunctionNames: ["expect", "expect*", "assert*", "check*", "test*"]}]
        }
    },

    {
        name: "app/rules",
        rules: {
            "vue/multi-word-component-names": "off",
            "no-prototype-builtins": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_"
                }
            ],
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["**/utils"],
                            importNames: ["rawDeepClone"],
                            message: "rawDeepClone reads through Vue's toRaw, so Vue does not track the reads, " +
                                "and a computed or watch that uses it does not update. " +
                                "Use it only in Vuex actions and mutations."
                        }
                    ]
                }
            ]
        }
    },

    {
        // A Node.js script. The TypeScript files do not need this, because TypeScript checks the names.
        name: "app/node-scripts",
        files: ["generateTypes.js"],
        languageOptions: {
            globals: {console: "readonly", process: "readonly"}
        }
    },

    {
        name: "app/raw-deep-clone-allowed",
        files: ["src/app/store/**/actions.ts", "src/app/store/**/mutations.ts", "src/tests/**"],
        rules: {
            "no-restricted-imports": "off"
        }
    }
);
