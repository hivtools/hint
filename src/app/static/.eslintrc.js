module.exports = {
    root: true,
    parser: "vue-eslint-parser",
    parserOptions: {
        ecmaVersion: 2020
    },
    plugins: [
        "@typescript-eslint"
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:vue/vue3-essential",
        "@vue/typescript/recommended",
    ],
    env: {
        node: true,
    },
    overrides: [
        {
          files: [
              "**/tests/**/*.test.{j,t}s"
          ],
          env: {
            jest: true,
          },
        },
    ],
    rules: {
        "no-prototype-builtins": "off",
        "vue/multi-word-component-names": "off",
    }
};
