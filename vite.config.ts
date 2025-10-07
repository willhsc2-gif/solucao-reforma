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
      // O alias explícito para pdfjs-dist/build/pdf.worker.min.js foi removido.
      // Usaremos new URL() no componente para resolver o worker.
    },
  },
  // As configurações de optimizeDeps e build.rollupOptions foram comentadas anteriormente
  // para permitir que o Vite bundle o pdfjs-dist. Vamos mantê-las assim.
  // optimizeDeps: {
  //   exclude: ['pdfjs-dist'], 
  // },
  // build: {
  //   rollupOptions: {
  //     external: ['pdfjs-dist'], 
  //   },
  // },
}));