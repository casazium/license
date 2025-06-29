// vitest.config.js
export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'dist',
        '**/tests/**',
        '**/*.test.js',
        '**/__mocks__/**',
        '**/node_modules/**',
        'vitest.config.js',
        'index.js', // ← main entrypoint
        'src/db/init.js', // ← bootstrap DB setup
        'lib/config.js', // ← config loader (optional coverage)
        'sdk/cli.js', // ← CLI entrypoint, tested indirectly
        'scripts/**', // ← dev scripts (e.g. generate-signed-license.js)
        '**/setup.js', // ← test setup utilities
      ],
    },
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    silent: false,
  },
};
