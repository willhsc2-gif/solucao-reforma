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
      // O alias para 'pdfjs-dist/build/pdf.worker.min.js' foi removido.
      // O Vite agora resolverá o caminho diretamente do node_modules com o sufixo ?url.
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'], 
  },
  build: {
    rollupOptions: {
      external: ['pdfjs-dist'], 
    },
  },
}));