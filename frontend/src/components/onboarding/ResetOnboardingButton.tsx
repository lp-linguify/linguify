// src/components/onboarding/ResetOnboardingButton.tsx
// This is a developer tool for testing the onboarding process

import React from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "./OnboardingProvider";
import { Redo } from "lucide-react";

interface ResetOnboardingButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const ResetOnboardingButton: React.FC<ResetOnboardingButtonProps> = ({ variant = "outline" }) => {
  const { resetOnboarding } = useOnboarding();

  return (
    <Button variant={variant} onClick={resetOnboarding}>
      <Redo className="h-4 w-4 mr-2" />
      Reset Onboarding
    </Button>
  );
};

export default ResetOnboardingButton;