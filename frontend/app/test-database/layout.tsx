import React from 'react';

export default function TestDatabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>SizeWise Database Test</title>
        <meta name="description" content="Database validation tests for SizeWise Suite" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
