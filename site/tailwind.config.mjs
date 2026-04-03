/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        gold: {
          300: '#F5DEB3',
          400: '#E8C878',
          500: '#D4A853',
          600: '#B8912F',
        },
      },
    },
  },
  plugins: [],
}
