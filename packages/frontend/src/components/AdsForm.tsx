'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequestAds } from '../hooks/useAdsHooks';
import { RequestAdsFormInput } from '../../../metadata/agents/ads-agent.schema';
import { useQueryClient } from '@tanstack/react-query';

// Templates for different business types
const TEMPLATES = {
  coach: {
    prompt: "Create an eye-catching ad for my 8-week coaching program 'Transform Your Business' that offers step-by-step guidance for entrepreneurs looking to scale their business.",
    targetAudience: "Entrepreneurs and small business owners aged 30-50 who have hit a plateau in their business growth and want to reach 6-7 figures in annual revenue.",
    brandInfo: "Growth Catalyst Coaching provides high-touch coaching programs for entrepreneurs. Our approach combines proven business strategies with personalized accountability to help clients overcome growth barriers and achieve sustainable success.",
    stylePreferences: "Professional yet approachable, with clean design elements. Should convey expertise and transformation without appearing overly corporate.",
  },
  consultant: {
    prompt: "Create a compelling ad for my strategic marketing consultation service that helps businesses develop data-driven marketing strategies that increase ROI.",
    targetAudience: "Marketing directors and CMOs at mid-size businesses (50-500 employees) who struggle with measuring marketing effectiveness and need a systematic approach to improve results.",
    brandInfo: "MarketEdge Consulting specializes in analytical marketing strategy. We help businesses implement tracking frameworks, optimize marketing spend, and develop customer acquisition strategies that deliver measurable results.",
    stylePreferences: "Modern, analytical look with data visualization elements. Professional with a tech-forward appearance that conveys expertise and precision.",
  },
  agency: {
    prompt: "Create an attention-grabbing ad for our new 'Content Accelerator' program that helps businesses generate a quarter's worth of content in just 2 weeks.",
    targetAudience: "Agency owners and marketing teams at service-based businesses who know content marketing is vital but struggle with consistent production and strategic planning.",
    brandInfo: "ContentPro Agency is a full-service content marketing agency specializing in high-volume, high-quality content creation for professional service firms. Our unique production system combines AI tools with expert writers to scale content without sacrificing quality.",
    stylePreferences: "Vibrant and dynamic, showing content across multiple platforms. Should convey speed and efficiency while maintaining a professional image.",
  }
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('coach');
  
  const { mutate, isPending, isError, error } = useRequestAds();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  // Function to fill form with selected template data
  const fillWithTemplateData = () => {
    setFormData(TEMPLATES[selectedTemplate as keyof typeof TEMPLATES]);
  };

  // Handle template selection change
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
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
        
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <select
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="py-2 px-4 bg-bg-tertiary text-fg-secondary rounded-md font-medium border border-border hover:bg-bg-quaternary"
            >
              <option value="coach">Coaching Template</option>
              <option value="consultant">Consulting Template</option>
              <option value="agency">Agency Template</option>
            </select>
            <button
              type="button"
              onClick={fillWithTemplateData}
              className="py-2 px-4 bg-bg-tertiary text-fg-secondary rounded-md font-medium border border-border hover:bg-bg-quaternary w-full sm:w-auto"
            >
              Fill with Template
            </button>
          </div>
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
