import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/**/*.ts'],
      exclude: ['packages/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@client': path.resolve(__dirname, './packages/client/src'),
      '@server': path.resolve(__dirname, './packages/server/src'),
    },
  },
});