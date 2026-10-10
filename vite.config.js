import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: path.resolve(root, 'client'),
  publicDir: path.resolve(root, 'public'),
  plugins: [react()],
  server: { host: '0.0.0.0', port: 8081, strictPort: true },
  build: { outDir: path.resolve(root, 'dist'), emptyOutDir: true }
});
