'use client';

import React, { useState, useEffect } from 'react';
import { useGetAdsById } from '../hooks/useAdsHooks';
import Link from 'next/link';
import { RequestAdOutput, AdStatus } from '@metadata/agents/ads-agent.schema';

export function AdsDetail({ adId }: { adId: string }) {
  const { data: ad, isLoading, isError } = useGetAdsById(adId);
  const [copySuccess, setCopySuccess] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  
  const pendingStatusMessages = [
    "Generating your ad...",
    "Creating visual elements...",
    "Adding brand elements...",
    "Finalizing design...",
    "Almost there..."
  ];
  
  useEffect(() => {
    if (isPending()) {
      const interval = setInterval(() => {
        setStatusIndex((prevIndex) => (prevIndex + 1) % pendingStatusMessages.length);
      }, 2500);
      
      return () => clearInterval(interval);
    }
  }, [ad]);

  const isPending = () => {
    if (!ad) return false;
    return ad.adStatus === AdStatus.PENDING;
  };

  const handleCopyToClipboard = () => {
    if (ad?.content) {
      navigator.clipboard.writeText(ad.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };
  
  // Format title by removing markdown and special characters
  const formatTitle = (title: string) => {
    const cleanTitle = title
      .replace(/^\*\*(.*)\*\*$/, '$1') // Remove markdown ** if present
      .trim();
      
    const titleMatch = cleanTitle.match(/^(?:Title:\s*)?[""]?(.+?)[""]?$/i);
    return titleMatch ? titleMatch[1] : cleanTitle;
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center p-12 min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-secondary border-t-transparent"></div>
        <p className="mt-4 text-fg-secondary">Loading ad...</p>
      </div>
    );
  }
  
  if (isError || !ad) {
    return (
      <div className="bg-error bg-opacity-10 p-8 rounded-lg text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl text-error font-medium mt-4">Error Loading Ad</h2>
        <p className="text-fg-secondary mt-2">We couldn't load the requested ad.</p>
        <Link 
          href="/ads" 
          className="mt-6 inline-block px-6 py-3 bg-accent-primary text-fg-primary rounded-md hover:bg-accent-secondary transition-colors"
        >
          Back to All Ads
        </Link>
      </div>
    );
  }
  
  const title = ad.title ? formatTitle(ad.title) : 'Ad';
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back navigation link */}
      <div className="mb-4 pt-2">
        <Link 
          href="/ads" 
          className="flex items-center text-accent-secondary hover:text-accent-tertiary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to All Ads
        </Link>
      </div>
      
      {/* Header with title and action buttons */}
      <div className="mb-8 pb-6 border-b border-border">
        <div>
          <div className="max-w-3xl">
            <h1 className="text-xl md:text-2xl font-bold text-fg-primary leading-tight mb-1">
              {title}
            </h1>
          </div>
          
          {/* Action buttons below title, justified right */}
          <div className="flex gap-4 mt-4 justify-end">
            <button 
              className={`flex items-center px-4 py-2 rounded-md transition-colors text-sm ${
                copySuccess 
                  ? 'bg-success text-white' 
                  : 'bg-bg-tertiary text-fg-primary hover:bg-bg-secondary'
              }`}
              onClick={handleCopyToClipboard}
              disabled={!ad.content}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            
            <Link
              href={`/ads/create`}
              className="flex items-center px-4 py-2 bg-accent-primary text-fg-primary rounded-md hover:bg-accent-secondary transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Ad
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="bg-bg-secondary rounded-xl shadow-lg border border-border overflow-hidden">
        {/* Image display */}
        {ad.imageUrl && !isPending() ? (
          <div className="w-full h-64 md:h-96 relative">
            <img 
              src={ad.imageUrl} 
              alt={title} 
              className="w-full h-full object-contain"
            />
          </div>
        ) : isPending() ? (
          <div className="w-full h-64 md:h-96 flex items-center justify-center bg-bg-tertiary bg-opacity-30">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-pulse mb-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-secondary border-t-transparent"></div>
                  <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-bg-secondary"></div>
                  </div>
                </div>
              </div>
              <p className="text-fg-secondary text-center animate-pulse">
                {pendingStatusMessages[statusIndex]}
              </p>
              <p className="text-fg-tertiary text-sm mt-4">
                This may take a few minutes
              </p>
            </div>
          </div>
        ) : null}
        
        <div className="p-8">
          <div className="prose prose-lg prose-invert prose-headings:text-fg-primary prose-p:text-fg-secondary prose-a:text-accent-secondary max-w-none leading-relaxed">
            {ad.content ? (
              ad.content.split('\n\n').map((paragraph: string, index: number) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))
            ) : isPending() ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-fg-secondary text-center animate-pulse">
                  {pendingStatusMessages[statusIndex]}
                </p>
              </div>
            ) : (
              <p className="text-center text-fg-tertiary py-8">No content available</p>
            )}
          </div>
          
          {/* Ad details section */}
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold mb-4 text-fg-primary">Ad Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-fg-tertiary mb-1">Target Audience</h4>
                <p className="text-fg-secondary">{ad.targetAudience || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-fg-tertiary mb-1">Style Preferences</h4>
                <p className="text-fg-secondary">{ad.stylePreferences || 'Not specified'}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-fg-tertiary mb-1">Brand Information</h4>
                <p className="text-fg-secondary">{ad.brandInfo || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
