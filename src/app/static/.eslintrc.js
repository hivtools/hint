module.exports = {
    root: true,
    parser: "vue-eslint-parser",
    parserOptions: {
        "parser": '@typescript-eslint/parser'
    },
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:vue/essential'
    ],
    rules: {
        "no-prototype-builtins": "off"
    }
};
