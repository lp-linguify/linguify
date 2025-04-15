// src/addons/help/types/index.ts
/**
 * @file src/addons/help/types/index.ts
 * @description This file contains the types and interfaces used in the help addon of the application.
 */

export interface Tutorial {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    videoUrl?: string;
}

export interface FAQItem {
    id: number;
    question: string;
    answer: string;
}