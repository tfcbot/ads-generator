'use client';

import React from 'react';
import Link from 'next/link';
import { useGetAllAds } from '../hooks/useAdsHooks';
import { RequestAdsOutput } from '../../../metadata/agents/ads-agent.schema';

export function AdsList() {
  const { data: adsList, isLoading, isError } = useGetAllAds();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-secondary"></div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="bg-error bg-opacity-10 p-6 rounded-lg text-center">
        <h2 className="text-error font-medium">Error loading ads</h2>
        <p className="text-fg-secondary mt-2">Could not load ads at this time. Please try again later.</p>
      </div>
    );
  }
  
  if (!adsList || adsList.length === 0) {
    return (
      <div className="bg-bg-secondary bg-opacity-60 p-8 rounded-lg text-center border border-border">
        <h2 className="text-xl font-medium text-fg-primary">No ads yet</h2>
        <p className="text-fg-secondary mt-2">Submit your first ad task to see it here.</p>
        <Link 
          href="/ads/create" 
          className="mt-4 inline-block px-4 py-2 bg-accent-primary text-fg-primary rounded-md hover:bg-opacity-90"
        >
          Create Ad
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg-primary">Your Ads</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adsList.map((ad: RequestAdsOutput) => (
          <Link 
            key={ad.adId}
            href={`/ads/${ad.adId}`}
            className="block bg-bg-secondary p-6 rounded-lg shadow-card border border-border hover:border-accent-tertiary transition-all"
          >
            <h2 className="text-lg font-semibold text-fg-primary mb-2 truncate">{ad.title}</h2>
            <p className="text-fg-secondary line-clamp-3">{ad.content.substring(0, 150)}...</p>
            {ad.imageUrl && (
              <div className="mt-3 h-40 relative overflow-hidden rounded-md">
                <img 
                  src={ad.imageUrl} 
                  alt={ad.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
