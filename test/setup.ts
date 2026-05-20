import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom doesn't implement URL.createObjectURL / revokeObjectURL.
if (!('createObjectURL' in URL)) {
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: (_: Blob) => `blob:mock-${Math.random().toString(36).slice(2)}`,
  });
}
if (!('revokeObjectURL' in URL)) {
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: () => undefined,
  });
}

// Some Node builds lack Blob.arrayBuffer in jsdom polyfills.
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function arrayBuffer() {
    return new Response(this).arrayBuffer();
  };
}

// jsdom 25 doesn't ship navigator.clipboard. Install a minimal polyfill so
// tests can vi.spyOn navigator.clipboard.writeText.
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: {
      writeText: async (_: string) => undefined,
      readText: async () => '',
    },
  });
}

// Reset DOM and the in-memory IndexedDB between tests so each starts clean.
afterEach(async () => {
  cleanup();
  localStorage.clear();
  const { __resetForTests } = await import('../src/lib/db');
  await __resetForTests();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('slickshot');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
});
