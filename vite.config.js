import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.js"),
        schemas: resolve(__dirname, "src/schemas/index.js"),
        utils: resolve(__dirname, "src/utils/index.js"),
        hooks: resolve(__dirname, "src/hooks/index.js"),
        services: resolve(__dirname, "src/services/index.js"),
        components: resolve(__dirname, "src/components/index.js"),
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "firebase",
        "firebase/app",
        "firebase/firestore",
        "firebase/storage",
        "firebase/auth",
        "@tiptap/react",
        "@tiptap/starter-kit",
        "@tiptap/extension-link",
        "@tiptap/extension-placeholder",
        "browser-image-compression",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
    sourcemap: true,
    minify: false, // Keep readable for debugging during development
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
