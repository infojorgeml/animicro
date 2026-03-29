/** @type {import('tailwindcss').Config} */
export default {
  content: ['./admin/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FBF5FF',
          100: '#F5E6FF',
          200: '#E6B3FF',
          500: '#A200FF',
          600: '#8800CC',
          700: '#7A00B8',
          900: '#3D0066',
        },
      },
    },
  },
  plugins: [],
};
