'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard for proper user experience
    router.replace('/dashboard');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
          Welcome to SizeWise Suite
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Redirecting to dashboard...
        </p>
      </div>
    </div>
  );
}
