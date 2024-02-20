module.exports = {
  root: true,
  extends: [
    "@nuxt/eslint-config",
    "@vue/eslint-config-prettier/skip-formatting",
    // "plugin:@typescript-eslint/recommended-type-checked"
    // "plugin:vue/vue3-strongly-recommended"
  ],
  env: {
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    "vue/multi-word-component-names": 0,
    "no-dupe-keys": 0,
    "no-unused-vars": 0,
    "no-sparse-arrays": 0,
    "no-func-assign": 0,
    "no-unsafe-finally": 0,
    "no-fallthrough": 0,
    "no-undef": 0,
    "no-empty": 0,
    "no-prototype-builtins": 0,
    "no-setter-return": 0,
    "no-cond-assign": 0,
    "no-control-regex": 0,
    "no-extra-boolean-cast": 0,
    "no-case-declarations": 0,
    "no-useless-escape": 0,
    "no-constant-condition": 0,
    "getter-return": 0,
  },
}
