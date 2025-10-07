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
      // Adiciona um alias específico para o worker do pdfjs-dist
      'pdfjs-dist/build/pdf.worker.entry': path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.entry.js'),
    },
  },
  // Removendo pdfjs-dist das exclusões de otimização e externalização.
  // Isso permite que o Vite processe e inclua o worker do pdfjs-dist corretamente.
  // optimizeDeps: {
  //   exclude: ['pdfjs-dist'], 
  // },
  // build: {
  //   rollupOptions: {
  //     external: ['pdfjs-dist'], 
  //   },
  // },
}));