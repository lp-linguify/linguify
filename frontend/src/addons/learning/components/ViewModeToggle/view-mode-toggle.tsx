// src/addons/learning/components/ViewModeToggle/view-mode-toggle.tsx
import React from 'react';
import { BookOpen, Library } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ViewModeToggleProps {
  viewMode: "units" | "lessons";
  onViewModeChange: (mode: "units" | "lessons") => void;
  className?: string;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
  className = ""
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={viewMode === "units"}
              onPressedChange={() => onViewModeChange("units")}
              className="data-[state=on]:bg-white/50 dark:data-[state=on]:bg-gray-800/50"
              aria-label="Show units"
            >
              <Library className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>View by Units</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={viewMode === "lessons"}
              onPressedChange={() => onViewModeChange("lessons")}
              className="data-[state=on]:bg-white/50 dark:data-[state=on]:bg-gray-800/50"
              aria-label="Show lessons"
            >
              <BookOpen className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>View by Lessons</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ViewModeToggle;