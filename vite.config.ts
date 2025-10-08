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
    // exclude: ['pdfjs-dist'], // Removido para permitir que o Vite processe o worker
  },
  build: {
    rollupOptions: {
      // external: ['pdfjs-dist'], // Removido para permitir que o Vite processe o worker
    },
  },
}));