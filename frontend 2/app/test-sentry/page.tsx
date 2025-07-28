'use client';

import React from 'react';

export default function TestSentryPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Sentry Test Panel Demo
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Testing the Enhanced Sentry Test Panel
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              This page is designed to test the new retractable Sentry Test Panel.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">How to test:</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Look for the toggle button in the top-left corner</li>
                <li>Click it to open/close the Sentry Test Panel</li>
                <li>Use keyboard shortcut: Ctrl+Shift+S</li>
                <li>Test all 8 Sentry test buttons</li>
                <li>Check for visual feedback and loading states</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Expected Features:</h3>
              <ul className="list-disc list-inside text-green-700 space-y-1">
                <li>✅ Retractable panel with smooth animations</li>
                <li>✅ Top-left positioning (avoiding UI conflicts)</li>
                <li>✅ Loading states for all test buttons</li>
                <li>✅ Success/error indicators</li>
                <li>✅ Keyboard shortcuts and click-outside-to-close</li>
                <li>✅ Enhanced Sentry configuration with error handling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
