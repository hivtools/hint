import { globalIgnores } from "eslint/config";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import { withVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";

export default withVueTs(
    {
        name: "app/files-to-lint",
        files: ["**/*.{vue,ts,mts,tsx}"]
    },

    // We do not lint the tests. The types in generated.d.ts are made by a script.
    globalIgnores(["src/tests/**", "src/app/generated.d.ts"]),

    js.configs.recommended,
    pluginVue.configs["flat/essential"],
    vueTsConfigs.recommended,

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
        name: "app/raw-deep-clone-allowed",
        files: ["src/app/store/**/actions.ts", "src/app/store/**/mutations.ts", "src/tests/**"],
        rules: {
            "no-restricted-imports": "off"
        }
    }
);
