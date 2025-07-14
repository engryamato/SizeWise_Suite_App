/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        '4xl': '2rem',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
      animation: {
        'move-background': 'moveBackground 60s linear infinite',
      },
      keyframes: {
        moveBackground: {
          'from': {
            'background-position': '0% 0%',
          },
          'to': {
            'background-position': '0% -1000%',
          },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
