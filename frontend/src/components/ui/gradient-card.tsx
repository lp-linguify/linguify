// src/components/ui/gradient-card.tsx
import { cn } from "@/core/utils/utils"

interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientCard({ children, className }: GradientCardProps) {
  return (
    <div 
      className={cn(
        "bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm shadow-xl rounded-lg",
        className
      )}
    >
      {children}
    </div>
  );
}