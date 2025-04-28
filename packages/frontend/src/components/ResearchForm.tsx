'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequestResearch } from '../hooks/useResearchHooks';
import { RequestResearchFormInput } from '@metadata/agents/research-agent.schema';
import { useQueryClient } from '@tanstack/react-query';

export function ResearchForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<RequestResearchFormInput>>({
    prompt: '',
  });
  
  const { mutate, isPending, isError, error } = useRequestResearch();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    mutate(formData as RequestResearchFormInput, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['allResearch'] });
        
        if (data && data.researchId) {
          router.push(`/research/${data.researchId}`);
        } else {
          router.push(`/research/`);
        }
      }
    });
  };
  
  return (
    <div className="bg-bg-secondary p-8 rounded-lg shadow-card border border-border">
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-fg-secondary mb-1">
            Research Topic
          </label>
          <input
            type="text"
            id="topic"
            name="prompt"
            value={formData.prompt}
            onChange={handleChange}
            required
            placeholder="Enter a topic to research"
            className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary text-fg-primary placeholder-fg-tertiary"
          />
        </div>
        
        {isError && (
          <div className="text-error text-sm">
            Error: {error instanceof Error ? error.message : 'Something went wrong'}
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className={`py-2 px-4 bg-accent-primary text-fg-primary rounded-md font-medium ${
              isPending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90'
            }`}
          >
            {isPending ? 'Researching...' : 'Submit Research Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
