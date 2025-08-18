import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
    './pages/**/*.{vue,js,ts,jsx,tsx}',
    './layouts/**/*.{vue,js,ts,jsx,tsx}',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        'prima-red': 'var(--color-prima-red)',
        'prima-red-100': 'var(--color-prima-red-100)',
        'prima-yellow': 'var(--color-prima-yellow)',
        'prima-link': 'var(--color-prima-link)',
        // Add dark mode colors here
        'prima-dark-bg': '#18181b',
        'prima-dark-surface': '#23232a',
        'prima-dark-text': '#e5e7eb',
        'prima-dark-accent': '#efbd00'
      },
      fontFamily: {
        roboto: [
          'Roboto',
          'ui-sans-serif',
          'system-ui',
          ...defaultTheme.fontFamily.sans
        ]
      }
    }
  },
  plugins: []
}
