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
        es2022: true,
    },
    overrides: [
        {
          files: [
            "**/__tests__/*.{j,t}s?(x)",
            "**/tests/unit/**/*.spec.{j,t}s?(x)",
          ],
          env: {
            jest: true,
          },
        },
    ],
    rules: {
        "no-prototype-builtins": "off",
        'vue/multi-word-component-names': 'off',
        // this is just a rule to enforce nesting script tags in vue templates
        // unfortunately it doesn't understand typescript AST so won't enforce any other
        // code indentation rules in Vue script tags
        // https://eslint.vuejs.org/rules/script-indent.html
        // "vue/script-indent": ["error", 4, {
        //     "baseIndent": 1,
        //     "ignores": [
        //         // nested objects, excluding top level of exported object (data, methods, computed, etc.)
        //         "[value.type='ObjectExpression']:not(:matches(ExportDefaultDeclaration, [left.property.name='exports']) > * > [value.type='ObjectExpression'])",
        //         // nested arrays
        //         "[value.type='ArrayExpression']"
        //     ]
        // }]
    }
};
