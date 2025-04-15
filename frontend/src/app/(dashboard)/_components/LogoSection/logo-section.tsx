'use client';

import React, { useState } from 'react';
import { ArrowLeft } from "lucide-react";

interface LogoSectionProps {
  title: string;
  icon?: React.ReactNode;
  isHomePage?: boolean;
  onNavigateHome: () => void;
  className?: string;
}

export default function LogoSection({
  title,
  icon,
  isHomePage = false,
  onNavigateHome,
  className = ""
}: LogoSectionProps) {
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);

  if (isHomePage) {
    return (
      <div className={`flex items-center ${className}`}>
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-400 bg-clip-text text-transparent font-montserrat">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center group cursor-pointer h-full ${className}`}
      onMouseEnter={() => setIsHoveringLogo(true)}
      onMouseLeave={() => setIsHoveringLogo(false)}
      onClick={onNavigateHome}
    >
      <div className="flex items-center relative h-full">
        {/* Back button that appears on hover */}
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${isHoveringLogo ? 'opacity-100' : 'opacity-0'
            }`}
        >
    <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300 translate-y-[2px]" />
    </div>

        {/* Page title/icon that shifts right on hover */}
        <div
          className={`flex items-center transition-all duration-300 ${isHoveringLogo ? 'translate-x-7' : 'translate-x-0'
            }`}
        >
          {icon && (
            <span className="inline-flex items-center justify-center h-5 w-5 mr-2 translate-y-[2px]">
              {icon}
            </span>
          )}
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-400 bg-clip-text text-transparent font-montserrat">
            {title}
          </span>
        </div>
      </div>
    </div>
  );
}