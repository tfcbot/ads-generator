import { RequestAdsFormInput, RequestAdsOutput, AdsStatus } from "@metadata/agents/ads-agent.schema";
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



export const getAllAds = async (token?: string): Promise<RequestAdsOutput[]> => {
  const timestamp = new Date().getTime();
  const absoluteUrl = await getAbsoluteUrl(`/ads?_t=${timestamp}`);
  try {
    const response = await fetch(absoluteUrl, {
      method: 'GET',
      headers: await getHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ads: ${response.status} ${response.statusText}`);
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
    console.error('Unexpected response format from getAllAds:', data);
    return [];
  } catch (error) {
    console.error('Error fetching all ads:', error);
    return [];
  }
}

export const getAdsById = async (adId: string, token?: string): Promise<RequestAdsOutput | null> => {
  const timestamp = new Date().getTime();
  const absoluteUrl = await getAbsoluteUrl(`/ads/${adId}?_t=${timestamp}`);
  try {
    const response = await fetch(absoluteUrl, {
      method: 'GET',
      headers: await getHeaders(token),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ad: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Log the raw response for debugging
    console.log('API response for ad:', data);
    
    // Handle different response formats
    if (data && typeof data === 'object') {
      // Check if data is directly the ad object
      if (data.adId && data.title && data.content) {
        return data as RequestAdsOutput;
      }
      
      // Check if wrapped in data property
      if (data.data && typeof data.data === 'object') {
        return data.data as RequestAdsOutput;
      }
      
      // Check if wrapped in body property
      if (data.body && typeof data.body === 'object') {
        return data.body as RequestAdsOutput;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching ad:', error);
    return null;
  }
}

export const postAds = async (requestData: RequestAdsFormInput, token: string): Promise<RequestAdsOutput> => {
  const absoluteUrl = await getAbsoluteUrl('/ads');
  try {
    // Generate a client-side ID for optimistic updates
    const clientGeneratedId = typeof window !== 'undefined' ? crypto.randomUUID() : randomUUID();
    
    // Create optimistic ad object
    const optimisticAd: RequestAdsOutput = {
      adId: clientGeneratedId,
      title: `Ad for: ${requestData.prompt.substring(0, 50)}...`,
      content: 'Generating your ad...',
      imageUrl: '',
      targetAudience: requestData.targetAudience,
      brandInfo: requestData.brandInfo,
      stylePreferences: requestData.stylePreferences,
      adStatus: AdsStatus.PENDING,
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
      throw new Error(`Failed to post ad: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Return the server response, which should now be the pending ad with the same ID
    const serverResponse = await response.json();
    
    // If the server returned a valid response, use it; otherwise, use our optimistic object
    if (serverResponse && 
        (serverResponse.adId || 
         (serverResponse.body && serverResponse.body.adId) || 
         (serverResponse.data && serverResponse.data.adId))) {
      return serverResponse;
    }
    
    return optimisticAd;
  } catch (error) {
    console.error('Error posting ad:', error);
    throw error;
  }
}
