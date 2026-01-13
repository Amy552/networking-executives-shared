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
        // React and related - use function to catch all react imports
        /^react($|\/)/,
        /^react-dom($|\/)/,
        // Firebase
        /^firebase($|\/)/,
        // Other peer deps
        "browser-image-compression",
        "react-datepicker",
        "react-datepicker/dist/react-datepicker.css",
        "@react-google-maps/api",
        "react-easy-crop",
        // Note: tiptap extensions are bundled (not external) so consuming apps don't need them
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
