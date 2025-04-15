// src/app/(auth)/callback/page.tsx
'use client';

import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CallbackPage() {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Processing login...");

  useEffect(() => {
    // Handle redirection once Auth0 has completed authentication
    if (!isLoading) {
      if (isAuthenticated) {
        setStatusMessage("Login successful! Redirecting to dashboard...");
        
        // Get return URL from query parameters or default to dashboard
        let returnTo = '/';
        
        try {
          // Try to extract returnTo from state param safely
          const urlParams = new URLSearchParams(window.location.search);
          const stateParam = urlParams.get('state');
          
          if (stateParam) {
            try {
              // First try standard base64 decoding
              const decodedState = JSON.parse(atob(stateParam));
              if (decodedState && decodedState.returnTo) {
                returnTo = decodedState.returnTo;
              }
            } catch (e) {
              console.log("Could not parse state as standard base64-encoded JSON");
              
              // If that fails, check if it's a plain string path
              if (stateParam.startsWith('/')) {
                returnTo = stateParam;
              }
            }
          }
        } catch (e) {
          console.error("Error processing state parameter:", e);
          // Fall back to default returnTo
        }
          
        // Redirect to intended destination
        setTimeout(() => {
          router.push(returnTo);
        }, 1000);
      } else if (error) {
        setStatusMessage(`Login failed: ${error.message || 'Unknown error'}`);
        console.error("Auth0 error:", error);
        // Redirect to login page after delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    }
  }, [isAuthenticated, isLoading, error, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center dark:bg-gray-800 dark:text-white">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
        <h1 className="text-2xl font-bold mb-2">
          {isLoading ? "Processing" : isAuthenticated ? "Success!" : "Please wait..."}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{statusMessage}</p>
      </div>
    </div>
  );
}