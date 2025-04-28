'use client';

import { useUserCredits } from '../hooks/useCredits';

export function Credits() {
  const { data: credits, isLoading } = useUserCredits();
  
  return (
    <div className="text-fg-secondary text-sm">
      {isLoading ? (
        <div className="h-4 bg-bg-tertiary rounded animate-pulse w-20" />
      ) : (
        <span className="font-medium">Credits: {credits?.toLocaleString() ?? 0}</span>
      )}
    </div>
  );
} 