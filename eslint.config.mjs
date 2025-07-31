import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  antfu({
    rules: {
      'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
      'node/prefer-global/process': 'off',
      'no-console': ['warn', { allow: ['info', 'error'] }],
    },
  }),
)
