import { RequestResearchFormInput, RequestResearchOutput, ResearchStatus } from "@metadata/agents/research-agent.schema";
import { randomUUID } from "crypto";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

const API_CONFIG = {
  baseUrl: API_URL,
  version: '',
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
};


export const getAbsoluteUrl = async (path: string): Promise<string> => {
  return `${API_CONFIG.baseUrl}${path}`;
};

export const getHeaders = async (token?: string): Promise<HeadersInit> => {
  const headers: Record<string, string> = {
    ...API_CONFIG.defaultHeaders,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const getAllResearch = async (token?: string): Promise<RequestResearchOutput[]> => {
  const timestamp = new Date().getTime();
  const absoluteUrl = await getAbsoluteUrl(`/research?_t=${timestamp}`);
  try {
    const response = await fetch(absoluteUrl, {
      method: 'GET',
      headers: await getHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch research: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.data)) {
        return data.data;
      } else if (data.body && Array.isArray(data.body)) {
        return data.body;
      }
    }
    
    // If we reach here, the response format was unexpected
    console.error('Unexpected response format from getAllResearch:', data);
    return [];
  } catch (error) {
    console.error('Error fetching all research:', error);
    return [];
  }
}

export const getResearchById = async (researchId: string, token?: string): Promise<RequestResearchOutput | null> => {
  const timestamp = new Date().getTime();
  const absoluteUrl = await getAbsoluteUrl(`/research/${researchId}?_t=${timestamp}`);
  try {
    const response = await fetch(absoluteUrl, {
      method: 'GET',
      headers: await getHeaders(token),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch deep research: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Log the raw response for debugging
    console.log('API response for research:', data);
    
    // Handle different response formats
    if (data && typeof data === 'object') {
      // Check if data is directly the research object
      if (data.researchId && data.title && data.content) {
        return data as RequestResearchOutput;
      }
      
      // Check if wrapped in data property
      if (data.data && typeof data.data === 'object') {
        return data.data as RequestResearchOutput;
      }
      
      // Check if wrapped in body property
      if (data.body && typeof data.body === 'object') {
        return data.body as RequestResearchOutput;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching research:', error);
    return null;
  }
}

export const postResearch = async (requestData: RequestResearchFormInput, token: string): Promise<RequestResearchOutput> => {
  const absoluteUrl = await getAbsoluteUrl('/research');
  try {
    // Generate a client-side ID for optimistic updates
    const clientGeneratedId = typeof window !== 'undefined' ? crypto.randomUUID() : randomUUID();
    
    // Create optimistic research object
    const optimisticResearch: RequestResearchOutput = {
      researchId: clientGeneratedId,
      userId: '', // Will be filled by the server
      title: `Research for: ${requestData.prompt.substring(0, 50)}...`,
      content: 'Researching your topic...',
      citation_links: [],
      researchStatus: ResearchStatus.PENDING,
      summary: ''
    };

    const response = await fetch(absoluteUrl, {
      method: 'POST',
      headers: await getHeaders(token),
      body: JSON.stringify({
        ...requestData,
        id: clientGeneratedId // Send the client-generated ID to the server
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to post research: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Return the server response, which should now be the pending research with the same ID
    const serverResponse = await response.json();
    
    // If the server returned a valid response, use it; otherwise, use our optimistic object
    if (serverResponse && 
        (serverResponse.researchId || 
         (serverResponse.body && serverResponse.body.researchId) || 
         (serverResponse.data && serverResponse.data.researchId))) {
      return serverResponse;
    }
    
    return optimisticResearch;
  } catch (error) {
    console.error('Error posting research:', error);
    throw error;
  }
}
