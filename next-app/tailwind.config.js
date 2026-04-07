/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b1326",
        surface: "#171f33",
        "surface-variant": "#2d3449",
        primary: "#7bd0ff",
        "on-primary": "#00354a",
        secondary: "#b7c8e1",
        error: "#ffb4ab",
        "error-container": "#93000a",
        "on-background": "#dae2fd",
        "on-surface-variant": "#c6c6cd",
        outline: "#909097",
      },
    },
  },
  plugins: [],
};
