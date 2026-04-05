/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-green': '#193C1F',
        'muted-green': '#8EA087',
        'tan': '#D1B698',
        'light-beige': '#EDE4D8',
        'pale-green-grey': '#D0D5CB',
        'off-white': '#F7F3ED',
      }
    },
  },
  plugins: [],
}