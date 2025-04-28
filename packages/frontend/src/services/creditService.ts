import { parseApiResponse, UserCreditsResponseSchema } from "@metadata/api-response.schema";

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

export const getHeaders = async (token: string): Promise<HeadersInit> => {
  const headers: Record<string, string> = {
    ...API_CONFIG.defaultHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const getUserCredits = async (token: string): Promise<number> => {
  const absoluteUrl = await getAbsoluteUrl('/credits');
  try {
    const response = await fetch(absoluteUrl, {
      method: 'GET',
      headers: await getHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch credits: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // Use the shared schema parser which handles both unwrapped and wrapped responses
    const parsedData = parseApiResponse(responseData, UserCreditsResponseSchema);
    return parsedData.credits;
  } catch (error) {
    console.error('Error fetching credits:', error);
    return 0;
  }
}

export async function initiateCheckout(token: string): Promise<string> {
  const absoluteUrl = await getAbsoluteUrl('/checkout');
  try {
    const response = await fetch(absoluteUrl, {
      method: 'POST',
      headers: await getHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to initiate checkout: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as { id: string };
    return data.id;
  } catch (error) {
    console.error('Error initiating checkout:', error);
    throw error;
  }
} 