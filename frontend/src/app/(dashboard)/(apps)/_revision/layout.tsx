// src/app/(dashboard)/(apps)/revision/layout.tsx
'use client';

import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import QueryProvider from '@/core/providers/QueryProvider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

function ErrorFallback({ error, resetErrorBoundary }: { 
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-md">
      <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
      <pre className="text-sm text-red-600 mb-4">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function RevisionLayout({ children }: LayoutProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.reload();
      }}
    >
      <QueryProvider>
        <Suspense fallback={<LoadingFallback />}>
          <main className={`${inter.className} min-h-screen bg-background text-foreground`}>
            {children}
          </main>
        </Suspense>
        <Toaster />
      </QueryProvider>
    </ErrorBoundary>
  );
}