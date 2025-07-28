'use client';

import React from 'react';

/**
 * Environment Debug Component
 * 
 * Simple component to debug environment variable access
 */
export const EnvDebugComponent: React.FC = () => {
  const envVars = {
    superAdminEmail: process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
    superAdminPassword: process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD,
    nodeEnv: process.env.NODE_ENV,
    appName: process.env.NEXT_PUBLIC_APP_NAME,
    debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE,
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-2">Environment Variables Debug</h3>
      <pre className="text-sm">
        {JSON.stringify(envVars, null, 2)}
      </pre>
    </div>
  );
};
