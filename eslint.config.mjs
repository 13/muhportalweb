import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Codebase predates lint setup - keep noise rules relaxed
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // Vue 3 supports multiple template roots; existing pages use them
    'vue/no-multiple-template-root': 'off',
  },
})
