import '@testing-library/jest-dom';
import { expect, beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extend Vitest's expect method with methods from testing-library
// More: https://vitest.dev/guide/extending-matchers.html

// Run cleanup automatically after each test
afterEach(() => {
  cleanup();
}); 