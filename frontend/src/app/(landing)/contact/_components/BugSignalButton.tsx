'use client';

import React from 'react';
import Link from 'next/link';
import { Bug } from 'lucide-react';

const BugSignalButton = () => {
  return (
    <Link 
      href="/contact/bug-signal" 
      className="inline-flex items-center px-6 py-3 rounded-md bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-medium transition-transform hover:scale-105 shadow-md"
    >
      <Bug className="w-5 h-5 mr-2" />
      Signaler un bug
    </Link>
  );
};

export default BugSignalButton;