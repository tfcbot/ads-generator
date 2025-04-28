'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserCredits } from '../services/creditService';
import { useAuth } from './useAuth';

export function useUserCredits() {
  const { getAuthToken } = useAuth();
  
  return useQuery({
    queryKey: ['userCredits'],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No token found');
      }
      const credits = await getUserCredits(token);
      return credits;
    },
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true,
  });
} 