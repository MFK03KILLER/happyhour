/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Vazirmatn', 'Tahoma', 'system-ui', 'sans-serif'],
        sans: ['Vazirmatn', 'Tahoma', 'system-ui', 'sans-serif'],
      },
      colors: {
        teal: {
          50: '#E8F2F2', 100: '#C5DEDE', 400: '#3A8A8A',
          500: '#1F6F6F', 600: '#0E5C5C', 700: '#084848', 800: '#063838',
        },
        coral: { 400: '#FF8A7B', 500: '#FF6B5B', 600: '#E65244' },
        cream: { 50: '#FFFCF6', 100: '#FBF6EE', 200: '#F5EEDE' },
        ink: { 900: '#0F172A', 700: '#334155', 500: '#475569', 300: '#94A3B8' },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06)',
        lift: '0 2px 6px rgba(0,0,0,.06), 0 24px 48px rgba(0,0,0,.12)',
      },
      borderRadius: { '2.5xl': '20px', '3xl': '24px' },
    },
  },
  plugins: [],
};
