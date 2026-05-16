import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#2c2c2c",
          muted: "#5c5c5c",
        },
        paper: {
          DEFAULT: "#f7f4ef",
          warm: "#efeae1",
        },
        accent: {
          DEFAULT: "#8a1c1c",
          dark: "#6b1414",
        },
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
