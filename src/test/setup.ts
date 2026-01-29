import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// Mock scrollIntoView for jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  
  // Mock matchMedia for theme detection
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
  
  // Mock localStorage
  const storage: Record<string, string> = {};
  const localStorageMock = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
    length: 0,
    key: () => null,
  };
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: localStorageMock,
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
