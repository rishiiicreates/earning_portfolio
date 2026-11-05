import { defineConfig } from 'sourcey';

export default defineConfig({
  title: 'Ky HTTP Client Reference',
  description: 'Tiny and elegant HTTP client based on the Fetch API',
  repository: {
    url: 'https://github.com/sindresorhus/ky',
    commit: '3541888878c4d303a8bc2ad61815f4e048f55a5d',
    branch: 'main',
  },
  adapter: 'markdown',
  outDir: './dist/docs/ky-reference',
  baseUrl: '/ky-reference',
  siteUrl: 'https://docs.agent-runway.dev',
  sources: [
    {
      entry: './source/index.ts',
      include: ['./source/**/*.ts'],
    },
  ],
  nav: [
    { title: 'Overview', path: '/' },
    { title: 'Client Methods', path: '/api/methods' },
    { title: 'Instance Factory', path: '/api/instance' },
    { title: 'Error Hierarchy', path: '/api/errors' },
    { title: 'Type Guards', path: '/api/type-guards' },
    { title: 'Utilities & Hooks', path: '/api/utils' },
  ],
});
