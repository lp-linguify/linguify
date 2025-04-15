// src/components/onboarding/OnboardingProvider.tsx
'use client';
import React, { createContext, useContext, useState, useEffect } from "react";
import OnboardingFlow from "./OnboardingFlow";
import { useAuthContext } from "@/core/auth/AuthProvider";

// Create context
interface OnboardingContextType {
  isOnboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Provider component
export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);

  // Reset onboarding (for testing or manual reset)
  const resetOnboarding = () => {
    localStorage.removeItem("onboardingCompleted");
    setIsOnboardingComplete(false);
    setShowOnboarding(true);
  };

  // Set onboarding as complete
  const setOnboardingComplete = (complete: boolean) => {
    localStorage.setItem("onboardingCompleted", complete ? "true" : "false");
    setIsOnboardingComplete(complete);
    setShowOnboarding(!complete);
  };

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboardingStatus = () => {
      // Don't show onboarding if user is not authenticated yet
      if (isLoading || !isAuthenticated || !user) {
        return;
      }

      // Check if onboarding has been completed (stored in localStorage)
      const hasCompletedOnboarding = localStorage.getItem("onboardingCompleted") === "true";
      
      // Check if profile is complete
      const isProfileComplete = !!(
        user.first_name && 
        user.last_name && 
        user.native_language && 
        user.target_language && 
        user.language_level
      );

      const shouldShowOnboarding = !hasCompletedOnboarding && !isProfileComplete;
      
      setIsOnboardingComplete(hasCompletedOnboarding || isProfileComplete);
      setShowOnboarding(shouldShowOnboarding);
    };

    checkOnboardingStatus();
  }, [isAuthenticated, isLoading, user]);

  // Handler for when onboarding is completed
  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        setOnboardingComplete,
        resetOnboarding
      }}
    >
      {children}
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}
    </OnboardingContext.Provider>
  );
};

// Custom hook
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};

export default OnboardingProvider;