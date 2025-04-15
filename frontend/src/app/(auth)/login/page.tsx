// src/app/(auth)/login/page.tsx
'use client';

import { useEffect, useState } from "react";
import { useAuthContext } from "@/core/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuthContext();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect authenticated users
  useEffect(() => {
    if (mounted && isAuthenticated && !isLoading) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, mounted, router]);

  // Handle login
  const handleLogin = () => {
    login(window.location.pathname);
  };

  // Don't render during SSR
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to Linguify</h1>
        
        {isLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : isAuthenticated ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">You are already logged in. Redirecting...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Sign in to access your personalized language learning experience.
            </p>
            <button 
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}