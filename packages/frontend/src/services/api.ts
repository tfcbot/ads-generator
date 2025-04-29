import { 
  RequestAdFormInput, 
  RequestAdOutput, 
  AdStatus, 
  RequestAdOutputSchema, 
  RequestAdFormInputSchema 
} from "@metadata/agents/ads-agent.schema";
import { MessageSchema } from "@metadata/message.schema";
import { z } from "zod";

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

// Create a response schema that combines MessageSchema with data of type RequestAdOutput[]
const AdsListResponseSchema = MessageSchema.extend({
  data: z.array(RequestAdOutputSchema)
});

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
    
    const responseData = await response.json();
    
    // Parse response with Zod schema
    const result = AdsListResponseSchema.parse(responseData);
    return result.data;
  } catch (error) {
    console.error('Error fetching all ads:', error);
    throw error;
  }
}

// Create a response schema for a single ad
const AdResponseSchema = MessageSchema.extend({
  data: RequestAdOutputSchema
});

export const getAdsById = async (adId: string, token?: string): Promise<RequestAdOutput> => {
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
    
    const responseData = await response.json();
    
    // Parse response with Zod schema
    const result = AdResponseSchema.parse(responseData);
    return result.data;
  } catch (error) {
    console.error('Error fetching ad:', error);
    throw error;
  } 
}

export const postAds = async (requestData: RequestAdFormInput, token: string): Promise<RequestAdOutput> => {
  const absoluteUrl = await getAbsoluteUrl('/ads');
  try {
    // Validate request data with Zod
    const validatedData = RequestAdFormInputSchema.parse(requestData);
    
    const response = await fetch(absoluteUrl, {
      method: 'POST',
      headers: await getHeaders(token),
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to post ad: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    
    // Parse response with Zod schema
    const result = AdResponseSchema.parse(responseData);
    return result.data;
  } catch (error) {
    console.error('Error posting ad:', error);
    throw error;
  }
}
