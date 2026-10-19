/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './app.js'],
  theme: {
    extend: {
      fontFamily: { display: ['"Baloo 2"', 'system-ui', 'sans-serif'] },
    },
  },
};
