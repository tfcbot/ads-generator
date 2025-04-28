'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RequestAdsFormInput, RequestAdsOutput, AdsStatus } from '../../../metadata/agents/ads-agent.schema';
import { getAllAds, getAdsById, postAds } from '../services/api';
import { useAuth } from './useAuth';

/**
 * Hook for generating ads
 */
export function useRequestAds() {
  const { getAuthToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RequestAdsFormInput) => {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No token found');
      }
      return await postAds(request, token);
    },
    onSuccess: (data) => {
      if (data && data.adId) {
        queryClient.setQueryData(['ad', data.adId], data);
        
        const allAds = queryClient.getQueryData<RequestAdsOutput[]>(['allAds']);
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

/**
 * Hook for fetching a specific ad by ID
 */
export function useGetAdsById(adId?: string) {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: ['ad', adId],
    queryFn: async () => {
      if (!adId) {
        return null;
      }

      const token = await getAuthToken();
      
      const timestamp = new Date().getTime();
      console.log(`Fetching ad ${adId} at ${timestamp}`);
      
      const response = await getAdsById(adId, token || undefined);
      
      if (!response) {
        return null;
      }
      
      return response as RequestAdsOutput;
    },
    refetchInterval: (query) => {
      const data = query.state.data as RequestAdsOutput | null;
      
      if (data?.adStatus === AdsStatus.PENDING) {
        return 5000; // Poll every 5 seconds if pending
      }
      
      return false; // No polling for completed ads
    },
    enabled: !!adId,
  });
}
