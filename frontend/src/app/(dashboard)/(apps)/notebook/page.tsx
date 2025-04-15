// src/app/(dashboard)/(apps)/notebook/page.tsx
"use client";

import NotebookApp from '../../../../addons/notebook/components/NotebookApp';

export default function NotebookPage() {
  return (
    // Enlever toutes les marges et remplir tout l'espace disponible
    <div className="-ml-4 h-[calc(100vh-4rem)] flex-1 overflow-hidden">
      <NotebookApp />
    </div>
  );
}