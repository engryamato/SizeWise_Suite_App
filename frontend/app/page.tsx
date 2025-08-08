'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // For unauthenticated users, send to login; authenticated users will be redirected onward by login page
    router.replace('/auth/login');
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
