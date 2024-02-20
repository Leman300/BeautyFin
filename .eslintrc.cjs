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
  },
}
