import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    clearMocks: true,
    env: {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_USER: 'default',
        REDIS_PASSWORD: 'mysecretpassword',
    },
    coverage: {
        reporter: ['text', 'html'], // Generate text and HTML reports
        include: ['src/**/*.ts'], // Include only source files
        exclude: ['**/*.test.ts'], // Exclude test files
    },
  },
})