import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.test.*',
        '**/*.config.*',
        '.nuxt/**',
        'dist/**'
      ]
    }
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
      '~/lib': resolve(__dirname, 'lib'),
      '~/server': resolve(__dirname, 'server'),
      '~/types': resolve(__dirname, 'types'),
      '~/utils': resolve(__dirname, 'utils'),
      '~/composables': resolve(__dirname, 'composables')
    }
  }
})