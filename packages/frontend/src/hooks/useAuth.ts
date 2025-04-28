'use client';

import { useAuth as useClerkAuth } from '@clerk/nextjs';

export function useAuth() {
  const { getToken, isSignedIn, userId } = useClerkAuth();
  
  const getAuthToken = async () => {
    if (!isSignedIn) return null;
    return getToken();
  };
  
  return {
    getAuthToken,
    isSignedIn,
    userId
  };
} 