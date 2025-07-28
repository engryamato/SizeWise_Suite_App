/**
 * Debug test file for CenteredNavigation NavigationItem issue
 * Systematic debugging to identify undefined component causing test failures
 *
 * Using the same mocking approach as basic.test.tsx which works
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock Next.js navigation hooks - same approach as basic.test.tsx
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

// Mock framer-motion - this is likely the main issue since it's not in global mocks
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, onMouseEnter, ...props }: any) => {
      console.log('motion.div rendered');
      return (
        <div className={className} onClick={onClick} onMouseEnter={onMouseEnter} {...props}>
          {children}
        </div>
      );
    },
    nav: ({ children, className, ...props }: any) => {
      console.log('motion.nav rendered');
      return (
        <nav className={className} {...props}>
          {children}
        </nav>
      );
    },
  },
  AnimatePresence: ({ children }: any) => {
    console.log('AnimatePresence rendered');
    return <>{children}</>;
  },
}));

// Import the component AFTER mocking
import { CenteredNavigation } from '../CenteredNavigation';

// Test that our mocks are working - copied from basic.test.tsx
describe('Mock Verification', () => {
  test('Next.js router mock works', () => {
    const { useRouter } = require('next/navigation')
    const router = useRouter()
    expect(router.push).toBeDefined()
    expect(typeof router.push).toBe('function')
  })

  test('usePathname mock works', () => {
    const { usePathname } = require('next/navigation')
    const pathname = usePathname()
    console.log('usePathname returned:', pathname);
    expect(pathname).toBeDefined()
    expect(typeof pathname).toBe('string')
    expect(pathname).toBe('/')
  })
})

describe('CenteredNavigation Debug Tests', () => {
  beforeEach(() => {
    console.log('=== Starting new test ===');
    jest.clearAllMocks();
  });

  it('should render without NavigationItem errors', () => {
    console.log('Attempting to render CenteredNavigation...');

    try {
      const result = render(
        <CenteredNavigation
          user={{
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
          }}
          onThemeToggle={() => console.log('Theme toggle')}
          isDarkMode={false}
        />
      );

      console.log('CenteredNavigation rendered successfully!');
      console.log('Container HTML:', result.container.innerHTML);

      // Check if navigation is rendered
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();

    } catch (error) {
      console.error('Error rendering CenteredNavigation:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  });
});
