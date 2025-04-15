// src/app/(auth)/register/page.tsx
'use client';

import { useEffect, useState } from "react";
import { useAuthContext } from "@/core/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const { isAuthenticated, isLoading, register } = useAuthContext();
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

  // Handle registration
  const handleRegister = async () => {
    try {
      await register(window.location.pathname);
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  // Don't render during SSR
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">Join Linguify</h1>
        
        {isLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        ) : isAuthenticated ? (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">You are already logged in. Redirecting...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Create your account and start your language learning journey today.
            </p>
            <button 
              onClick={handleRegister}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              Sign Up with Email
            </button>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                Already have an account?
              </p>
              <Link href="/login">
                <button className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-3 px-4 rounded-md transition-colors">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}