import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'], // Exclui pdfjs-dist do pré-bundling para evitar problemas com workers
  },
  build: {
    rollupOptions: {
      external: ['pdfjs-dist'], // Trata pdfjs-dist como dependência externa durante o build
    },
  },
}));