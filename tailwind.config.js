/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F4E79',
          light: '#2E6CA4',
          dark: '#163A5C',
        },
        accent: {
          DEFAULT: '#1E7A45',
          light: '#3FCB7C',
        },
        error: {
          DEFAULT: '#B42318',
          light: '#FBE5E3',
        },
        warning: {
          DEFAULT: '#F39C12',
          light: '#FDF0DA',
        },
      },
    },
  },
  plugins: [],
};
