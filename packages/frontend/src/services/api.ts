import { RequestAdFormInput, RequestAdOutput, AdStatus } from "@metadata/agents/ads-agent.schema";
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



export const getAllAds = async (token?: string): Promise<RequestAdOutput[]> => {
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
    
    // Check if the response has the expected structure
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }

    // If we reach here, the response format was unexpected
    console.error('Unexpected response format from getAllAds:', data);
    return [];
  } catch (error) {
    console.error('Error fetching all ads:', error);
    return [];
  }
}

export const getAdsById = async (adId: string, token?: string): Promise<RequestAdOutput | null> => {
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
    
    // Check if the response has the expected structure
    if (data && data.data) {
      return data.data;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching ad:', error);
    return null;
  } 
}

export const postAds = async (requestData: RequestAdFormInput, token: string): Promise<RequestAdOutput> => {
  const absoluteUrl = await getAbsoluteUrl('/ads');
  try {
    
    const response = await fetch(absoluteUrl, {
      method: 'POST',
      headers: await getHeaders(token),
      body: JSON.stringify({
        ...requestData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to post ad: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Return the server response, which should now be the pending ad with the same ID
    const serverResponse = await response.json();
    
    // Check if the response has the expected structure
    if (serverResponse && serverResponse.data) {
      return serverResponse.data;
    }
    
    return serverResponse;
    
  } catch (error) {
    console.error('Error posting ad:', error);
    throw error;
  }
}

