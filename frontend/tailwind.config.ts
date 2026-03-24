import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f1721",
        mist: "#f2efe7",
        sand: "#e7dfcf",
        teal: "#127475",
        coral: "#df6d57",
        pine: "#23403a"
      },
      boxShadow: {
        panel: "0 20px 60px rgba(15, 23, 33, 0.08)"
      },
      backgroundImage: {
        "paper-grid":
          "radial-gradient(circle at top left, rgba(18,116,117,0.08), transparent 32%), linear-gradient(rgba(255,255,255,0.78), rgba(255,255,255,0.96))"
      }
    }
  },
  plugins: []
};

export default config;

