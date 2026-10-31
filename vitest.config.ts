import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@converto/core': path.resolve(__dirname, './packages/core/src/index.ts'),
      '@converto/tools': path.resolve(__dirname, './packages/tools/src/index.ts'),
    },
  },
});
