/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./**/templates/**/*.html",
    "./accounts/templates/**/*.html",
    "./hotels/templates/**/*.html",
    "./vendors/templates/**/*.html",
    "./locations/templates/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',
        secondary: '#F59E0B',
      },
    },
  },
  plugins: [],
}