/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0d1b2a',
        muted: '#6b7a99',
        brand: '#1a56ff',
        mint: '#00c48c'
      }
    }
  },
  plugins: []
};
