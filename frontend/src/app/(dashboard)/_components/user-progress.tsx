// frontend/src/app/dashboard/_components/user-progress.tsx
"use client";

import { Progress } from "@/components/ui/progress";
import { cva } from "class-variance-authority";
import { CheckCircle } from "lucide-react";
import { cn } from "@/core/utils/utils";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const progressVariants = cva(
  "transition-all",
  {
    variants: {
      size: {
        sm: "h-1.5",
        md: "h-2",
        lg: "h-3",
      },
      status: {
        low: "bg-purple-500",
        medium: "bg-yellow-500",
        high: "bg-emerald-500",
        complete: "bg-brand-purple",
      }
    },
    defaultVariants: {
      size: "md",
      status: "medium",
    }
  }
);

interface UserProgressProps {
  value?: number;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  animated?: boolean;
  tooltipText?: string;
}

export const UserProgress = ({
  value = 0,
  label = "Progress",
  className,
  size = "md",
  showIcon = true,
  animated = true,
  tooltipText,
}: UserProgressProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (animated) {
      // Start from current displayed value
      const startValue = displayValue;
      const endValue = value;
      const duration = 1000; // animation duration in ms
      const startTime = Date.now();
      
      // Animate progress value
      const animateValue = () => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        
        if (elapsedTime < duration) {
          const nextValue = startValue + ((endValue - startValue) * (elapsedTime / duration));
          setDisplayValue(Math.round(nextValue));
          requestAnimationFrame(animateValue);
        } else {
          setDisplayValue(endValue);
        }
      };
      
      requestAnimationFrame(animateValue);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated]);

  const getStatusClass = () => {
    if (value === 100) return "complete";
    if (value >= 75) return "high";
    if (value >= 25) return "medium";
    return "low";
  };

  const getLabelColor = () => {
    if (value === 100) return "text-brand-purple";
    if (value >= 75) return "text-emerald-600";
    if (value >= 25) return "text-yellow-600";
    return "text-purple-600";
  };

  const progressBar = (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground font-medium">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-sm font-semibold", value === 100 ? "bg-gradient-to-r from-brand-purple to-brand-gold bg-clip-text text-transparent" : getLabelColor())}>
            {displayValue}%
          </span>
          {showIcon && value === 100 && (
            <CheckCircle className="h-4 w-4 text-brand-purple" />
          )}
        </div>
      </div>
      <Progress 
        value={displayValue} 
        className={cn(
          progressVariants({ 
            size, 
            status: getStatusClass(),
          }),
          animated ? "transition-all duration-1000" : ""
        )} 
      />
    </div>
  );

  if (tooltipText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {progressBar}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return progressBar;
};