import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 75,
        statements: 90,
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'bin/**',
        'tests/**',
        'vitest.config.ts',
        'src/cli/index.ts',
      ],
    },
  },
});
