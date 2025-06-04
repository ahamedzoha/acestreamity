/// <reference types='vitest' />
import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(async (): Promise<UserConfig> => {
  // Dynamic import for ESM-only Tailwind CSS v4 plugin
  const tailwindcss = (await import('@tailwindcss/vite')).default;

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/frontend',

    server: {
      port: 3000,
      host: 'localhost',
    },

    preview: {
      port: 4300,
      host: 'localhost',
    },

    plugins: [react(), tailwindcss(), nxViteTsPaths()],

    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },

    build: {
      outDir: './dist',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },

    test: {
      globals: true,
      cache: {
        dir: '../../node_modules/.vitest',
      },
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: '../../coverage/apps/frontend',
        provider: 'v8',
      },
    },
  };
});
