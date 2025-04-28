import { BunPlugin, plugin } from 'bun';
import { resolve } from 'path';
import dotenv from 'dotenv';

// Debug current directory
console.log('Current working directory:', process.cwd());
const envPath = resolve(process.cwd(), '../../.env.test');
console.log('Resolved env path:', envPath);

// Load environment variables
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env.test:', result.error);
} else {
  console.log('Loaded environment variables:', result.parsed);
}

// Set up Bun test environment
export default {
  test: {
    timeout: 10000, // Set timeout to 10 seconds for API calls
    environment: 'node',
    coverage: {
      enabled: process.env.COVERAGE === 'true',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/**',
        'tests/mocks/**'
      ],
    },
  },
  plugins: [
    // Add any plugins if needed
  ],
  // Aliases to match the Jest configuration
  resolve: {
    alias: {
      '@packages/core/src': resolve(process.cwd(), 'src'),
      '@agent-runtime': resolve(process.cwd(), 'src/orchestrator/agent-runtime'),
      '@orchestrator': resolve(process.cwd(), 'src/orchestrator'),
      '@utils': resolve(process.cwd(), 'src/utils'),
      '@lib': resolve(process.cwd(), 'src/lib'),
      '@metadata': resolve(process.cwd(), 'src/metadata'),
    },
  },
}; 