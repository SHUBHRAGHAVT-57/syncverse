import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ignoredRelayPaths = ['**/.syncverse-data', '**/.syncverse-data/**'];

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // The local y-websocket LevelDB database contains files that Windows locks.
    // Vite should watch source files, not the relay's runtime persistence.
    watch: {
      ignored: ignoredRelayPaths,
    },
  },
});
