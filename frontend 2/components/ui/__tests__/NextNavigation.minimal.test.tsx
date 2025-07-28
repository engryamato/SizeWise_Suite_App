/**
 * Minimal test to verify Next.js navigation mocking works
 */

import { jest } from '@jest/globals';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

describe('Next.js Navigation Mock Test', () => {
  test('useRouter mock works', () => {
    const { useRouter } = require('next/navigation');
    const router = useRouter();
    console.log('router:', router);
    expect(router).toBeDefined();
    expect(router.push).toBeDefined();
    expect(typeof router.push).toBe('function');
  });

  test('usePathname mock works', () => {
    const { usePathname } = require('next/navigation');
    const pathname = usePathname();
    console.log('pathname:', pathname);
    expect(pathname).toBeDefined();
    expect(typeof pathname).toBe('string');
    expect(pathname).toBe('/');
  });
});
