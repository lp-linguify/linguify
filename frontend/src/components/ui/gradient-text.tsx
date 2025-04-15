// src/components/ui/gradient-text.tsx
import { cn } from "@/core/utils/utils";
import { commonStyles } from "@/styles/gradient_style";
import { HTMLAttributes } from "react";

interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
}

export function GradientText({ 
  children, 
  className, 
  ...props 
}: GradientTextProps) {
  return (
    <span 
      className={cn(commonStyles.gradientText, className)} 
      {...props}
    >
      {children}
    </span>
  );
}