'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RequestAdInput, RequestAdOutput, AdStatus, RequestAdFormInput } from '@metadata/agents/ads-agent.schema';
import { getAllAds, getAdsById, postAds } from '../services/api';
import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';

/**
 * Hook for generating ads
 */
export function useRequestAds() {
  const { getAuthToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RequestAdFormInput): Promise<RequestAdOutput> => {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No token found');
      }
        return await postAds(request, token);
    },
    onSuccess: (data: RequestAdOutput) => {
      if (data && data.adId) {
        queryClient.setQueryData(['ad', data.adId], data);
        
        const allAds = queryClient.getQueryData<RequestAdOutput[]>(['allAds']);
        if (allAds) {
          queryClient.setQueryData(['allAds'], [data, ...allAds]);
        }
      }
    }
  });
}

/**
 * Hook for fetching all ads
 */
export function useGetAllAds() {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: ['allAds'],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) {
        return null;
      }
      const response = await getAllAds(token);
      return response;
    },
  });
}

// Custom type for query function context that includes meta
interface QueryFunctionContext {
  meta?: {
    attemptCount?: number;
  };
}

/**
 * Hook for fetching a specific ad by ID with exponential backoff
 */
export function useGetAdsById(adId?: string) {
  const { getAuthToken } = useAuth();
  const [statusIndex, setStatusIndex] = useState(0);
  const queryClient = useQueryClient();
  
  const pendingStatusMessages = [
    "Generating your ad...",
    "Creating visual elements...",
    "Adding brand elements...",
    "Finalizing design...",
    "Almost there...",
    "This might take a few minutes...",
    "AI is working on your ad...",
    "Building your creative assets...",
    "Crafting the perfect ad for your brand...",
  ];
  
  // Set up rotation for status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % pendingStatusMessages.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, []);

  const query = useQuery({
    queryKey: ['ad', adId],
    queryFn: async (context: QueryFunctionContext) => {
      if (!adId) return null;

      const token = await getAuthToken();
      
      const timestamp = new Date().getTime();
      console.log(`Fetching ad ${adId} at ${timestamp}, attempt: ${context.meta?.attemptCount || 1}`);
      
      const response = await getAdsById(adId, token || undefined);
      
      return response;
    },
    refetchInterval: (query) => {
      const data = query.state.data as RequestAdOutput | null;
      
      // If not pending, stop polling
      if (!data || data.adStatus !== AdStatus.PENDING) {
        return false;
      }
      
      // Calculate attempt count from custom property we'll store
      const currentData = queryClient.getQueryData(['ad', adId]) as any;
      const attemptCount = (currentData?._attemptCount || 0) + 1;
      
      // Store attempt count as a custom property on the data
      queryClient.setQueryData(['ad', adId], {
        ...data,
        _attemptCount: attemptCount
      });
      
      // Calculate exponential backoff with a base of 5 seconds
      // Cap at 60 seconds (1 minute) to ensure we're still checking regularly
      const baseInterval = 5000; // 5 seconds
      const factor = 1.5;
      const maxInterval = 60000; // 1 minute
      
      const interval = Math.min(
        baseInterval * Math.pow(factor, attemptCount - 1), 
        maxInterval
      );
      
      console.log(`Next poll in ${interval/1000} seconds`);
      
      return interval;
    },
    enabled: !!adId,
    meta: { attemptCount: 1 },
  });

  return {
    ...query,
    statusMessage: pendingStatusMessages[statusIndex],
  };
}
