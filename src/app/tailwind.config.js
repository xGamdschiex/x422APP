/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        grow: {
          dark:    '#0D1B0E',
          surface: '#1A2E1C',
          primary: '#4CAF50',
          accent:  '#8BC34A',
          water:   '#29B6F6',
          danger:  '#FF5252',
          warn:    '#FFC107',
          text:    '#E8F5E9',
          muted:   '#81C784',
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mono:  ['"JetBrains Mono"', 'monospace'],
      }
    }
  },
  plugins: []
};
