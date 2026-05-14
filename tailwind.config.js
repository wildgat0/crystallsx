/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        carouselFade: {
          "0%":   { opacity: "0", transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in-up":    "fadeInUp 0.7s ease-out both",
        "fade-in":       "fadeIn 0.6s ease-out both",
        "carousel-fade": "carouselFade 0.4s ease-out both",
      },
      colors: {
        cream: {
          light: "#FFFFFF",
          DEFAULT: "#F7F7F7",
          dark: "#EFEFEF",
          border: "#E5E5E5",
        },
        dark: {
          DEFAULT: "#1A1814",
          warm: "#2B2520",
        },
        accent: {
          DEFAULT: "#C4A882",
          dark: "#8B6F47",
        },
        muted: "#8A837C",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        script: ["var(--font-pinyon)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
