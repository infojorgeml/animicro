/** @type {import('tailwindcss').Config} */
export default {
  content: ['./admin/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F6FDEB',
          100: '#EAFAD0',
          200: '#D3F5A0',
          500: '#8DDF0A',
          600: '#8FD624',
          700: '#74B31C',
          900: '#3D6609',
        },
      },
    },
  },
  plugins: [],
};
