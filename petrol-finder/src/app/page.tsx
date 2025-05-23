"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import to avoid SSR issues with browser-only components like maps
const PetrolFinderPage = dynamic(() => import('./Dashboard/page'), {
  ssr: false,
  loading: () => <LoadingState />
});

// Loading state while the map component is loading
const LoadingState = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
    <div className="w-16 h-16 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin"></div>
    <p className="mt-4 text-gray-600">Loading map and stations...</p>
  </div>
);

// Main app page
export default function Home() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PetrolFinderPage />
    </Suspense>
  );
}