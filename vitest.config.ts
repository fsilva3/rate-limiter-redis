import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    clearMocks: true,
    env: {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_USER: 'john',
        REDIS_PASSWORD: '123pass',
    }
  }
})