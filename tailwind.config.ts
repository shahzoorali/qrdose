import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eafaf3",
          100: "#cdf3e1",
          200: "#9de6c4",
          300: "#63d2a3",
          400: "#3fb27f",
          500: "#2f9e6c",
          600: "#1f8558",
          700: "#196b47",
          800: "#17553a",
          900: "#144631",
        },
      },
    },
  },
  plugins: [],
};

export default config;
