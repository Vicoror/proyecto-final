// src/setupTests.js
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Mock de alert
global.alert = vi.fn();

expect.extend(matchers);
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});