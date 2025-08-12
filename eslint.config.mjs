import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  antfu({
    stylistic: false,
    vue: true,
    typescript: true,
    nuxt: true,
    rules: {
      'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
      'node/prefer-global/process': 'off',
      'no-console': ['warn', { allow: ['info', 'error'] }],
      'comma-dangle': ['error', 'never'],
      // Enforce Stroustrup style so `else`/`catch` start on the next line after the closing brace
      'brace-style': ['error', 'stroustrup', { allowSingleLine: true }],
      'vue/brace-style': ['error', 'stroustrup', { allowSingleLine: true }],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'semi': ['error', 'never']
    }
  }),
  {
    ignores: ['src-tauri']
  }
)
