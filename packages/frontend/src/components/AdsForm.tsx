'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequestAds } from '../hooks/useAdsHooks';
import { RequestAdsFormInput } from '../../../metadata/agents/ads-agent.schema';
import { useQueryClient } from '@tanstack/react-query';

// Sample data for the form
const SAMPLE_DATA: Partial<RequestAdsFormInput> = {
  prompt: "Create an eye-catching summer promotion ad for our new refreshing iced tea drinks with a 20% discount for new customers.",
  targetAudience: "Health-conscious adults ages 25-45 who enjoy beverages with natural ingredients and are active on social media.",
  brandInfo: "FreshBrew is an organic tea company that specializes in naturally flavored iced teas made with premium ingredients. Our products contain no artificial sweeteners or preservatives.",
  stylePreferences: "Modern, bright and refreshing with vibrant colors. Should evoke a summer feeling and highlight the natural ingredients.",
};

export function AdsForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<RequestAdsFormInput>>({
    prompt: '',
    targetAudience: '',
    brandInfo: '',
    stylePreferences: '',
  });
  
  const { mutate, isPending, isError, error } = useRequestAds();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    mutate(formData as RequestAdsFormInput, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['allAds'] });
        
        if (data && data.adId) {
          router.push(`/ads/${data.adId}`);
        } else {
          router.push(`/ads/`);
        }
      }
    });
  };

  // Function to fill form with sample data
  const fillWithSampleData = () => {
    setFormData(SAMPLE_DATA);
  };
  
  return (
    <div className="bg-bg-secondary p-8 rounded-lg shadow-card border border-border">
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-fg-secondary mb-1">
            Ad Description/Prompt
          </label>
          <textarea
            id="prompt"
            name="prompt"
            value={formData.prompt}
            onChange={handleChange}
            required
            placeholder="Describe the ad you want to generate"
            className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary text-fg-primary placeholder-fg-tertiary min-h-[100px]"
          />
        </div>
        
        <div>
          <label htmlFor="targetAudience" className="block text-sm font-medium text-fg-secondary mb-1">
            Target Audience
          </label>
          <input
            type="text"
            id="targetAudience"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleChange}
            required
            placeholder="Describe your target audience"
            className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary text-fg-primary placeholder-fg-tertiary"
          />
        </div>
        
        <div>
          <label htmlFor="brandInfo" className="block text-sm font-medium text-fg-secondary mb-1">
            Brand/Product Information
          </label>
          <textarea
            id="brandInfo"
            name="brandInfo"
            value={formData.brandInfo}
            onChange={handleChange}
            required
            placeholder="Provide information about your brand or product"
            className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary text-fg-primary placeholder-fg-tertiary min-h-[80px]"
          />
        </div>
        
        <div>
          <label htmlFor="stylePreferences" className="block text-sm font-medium text-fg-secondary mb-1">
            Ad Style Preferences
          </label>
          <input
            type="text"
            id="stylePreferences"
            name="stylePreferences"
            value={formData.stylePreferences}
            onChange={handleChange}
            required
            placeholder="Describe your preferred ad style (e.g., professional, casual, minimalist)"
            className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary text-fg-primary placeholder-fg-tertiary"
          />
        </div>
        
        {isError && (
          <div className="text-error text-sm">
            Error: {error instanceof Error ? error.message : 'Something went wrong'}
          </div>
        )}
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={fillWithSampleData}
            className="py-2 px-4 bg-bg-tertiary text-fg-secondary rounded-md font-medium border border-border hover:bg-bg-quaternary"
          >
            Fill with Sample Data
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={`py-2 px-4 bg-accent-primary text-fg-primary rounded-md font-medium ${
              isPending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90'
            }`}
          >
            {isPending ? 'Generating Ad...' : 'Generate Ad'}
          </button>
        </div>
      </form>
    </div>
  );
}
