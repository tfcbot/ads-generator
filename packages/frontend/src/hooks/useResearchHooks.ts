'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RequestResearchFormInput, RequestResearchOutput, ResearchStatus } from '@metadata/agents/research-agent.schema';
import { getAllResearch, getResearchById, postResearch } from '../services/api';
import { useAuth } from './useAuth';

/**
 * Hook for generating research
 */
export function useRequestResearch() {
  const { getAuthToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RequestResearchFormInput) => {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No token found');
      }
      return await postResearch(request, token);
    },
    onSuccess: (data) => {
      // Add the new research to the cache immediately for optimistic updates
      if (data && data.researchId) {
        // Update the specific research query
        queryClient.setQueryData(['research', data.researchId], data);
        
        // Update the all research list if it exists in the cache
        const allResearch = queryClient.getQueryData<RequestResearchOutput[]>(['allResearch']);
        if (allResearch) {
          queryClient.setQueryData(['allResearch'], [data, ...allResearch]);
        }
      }
    }
  });
}

/**
 * Hook for fetching all research
 */
export function useGetAllResearch() {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: ['allResearch'],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) {
        return null;
      }
      const response = await getAllResearch(token);
      return response;
    },
  });
}

/**
 * Hook for fetching a specific research by ID
 */
export function useGetResearchById(researchId?: string) {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: ['research', researchId],
    queryFn: async () => {
      if (!researchId) {
        return null;
      }

      const token = await getAuthToken();
      
      // Add a cache-busting parameter to ensure we don't get cached responses
      const timestamp = new Date().getTime();
      console.log(`Fetching research ${researchId} at ${timestamp}`);
      
      const response = await getResearchById(researchId, token || undefined);
      
      // Return null for not found
      if (!response) {
        return null;
      }
      
      return response as RequestResearchOutput;
    },
    // Add conditional polling for pending research
    refetchInterval: (query) => {
      const data = query.state.data as RequestResearchOutput | null;
      
      if (data?.researchStatus === ResearchStatus.PENDING) {
        return 5000; // Poll every 5 seconds if pending
      }
      
      return false; // No polling for completed research
    },
    enabled: !!researchId,
  });
}
