import { RequestResearchInput, RequestResearchOutput } from '@metadata/agents/research-agent.schema';
import { describe, expect, test, beforeAll } from 'bun:test';
import { randomUUID } from 'crypto';
// Environment variables
const API_URL = 'https://oc7cyxj8v3.execute-api.us-east-1.amazonaws.com';

describe('Research API Endpoints', () => {
    const headers = {
        'Content-Type': 'application/json',
    };

  // Sample research request payload
  const testResearchRequest: RequestResearchInput = {
    id: randomUUID(),
    prompt: 'Explain the latest advancements in artificial intelligence and machine learning'
  };

  describe('POST /research endpoint', () => {
    test('should successfully submit a research request', async () => {
      console.log(API_URL);
      const response = await fetch(`${API_URL}/research`, {
        method: 'POST',
        headers,
        body: JSON.stringify(testResearchRequest)
      });

      // Verify response status
      expect(response.status).toBe(200);
      
      // Verify response data
      const responseData = await response.json() as { message: string; data: { researchId: string } };
      expect(responseData.message).toBe('Research generation request published');
    });

    test('should handle validation errors for invalid requests', async () => {
      // Call the endpoint with invalid data (empty prompt)
      const response = await fetch(`${API_URL}/research`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      });

      // Verify response status
      expect(response.status).toBe(400);
      
      // Verify error response
      const errorData = await response.json() as { message: string; errors: string[] };
      expect(errorData.message).toBe('Invalid request');
      expect(errorData.errors).toBeDefined();
    });
  });

  describe('GET /research endpoint', () => {
    test('should retrieve all research for the user', async () => {
      // Call the endpoint
      const response = await fetch(`${API_URL}/research`, {
        method: 'GET',
        headers
      });

      // Verify response status
      expect(response.status).toBe(200);
      
      // Verify response data structure
      const researchData = await response.json() as RequestResearchOutput[];
      expect(Array.isArray(researchData)).toBe(true);
      
      // Verify research item structure if data exists
      if (researchData.length > 0) {
        const firstResearch = researchData[0];
        expect(firstResearch.researchId).toBeDefined();
        expect(firstResearch.title).toBeDefined();
        expect(firstResearch.content).toBeDefined();
        expect(firstResearch.citation_links).toBeDefined();
      }
    });

    test('should retrieve a specific research by ID', async () => {
      const researchId = 'test-research-123';
      
      // Call the endpoint with specific ID
      const response = await fetch(`${API_URL}/research/${researchId}`, {
        method: 'GET',
        headers
      });

      // If the research exists, verify its structure
      if (response.status === 200) {
        const researchData = await response.json() as RequestResearchOutput;
        expect(researchData.researchId).toBeDefined();
        expect(researchData.title).toBeDefined();
        expect(researchData.content).toBeDefined();
        expect(researchData.citation_links).toBeDefined();
      } else {
        // If not found, that's also a valid response
        expect(response.status).toBe(404);
      }
    });

    test('should handle not found errors for non-existent research', async () => {
      const nonExistentId = 'non-existent-id';
      
      // Call the endpoint with non-existent ID
      const response = await fetch(`${API_URL}/research/${nonExistentId}`, {
        method: 'GET',
        headers
      });

      // Verify response status
      expect(response.status).toBe(404);
      
      // Verify error message
      const errorData = await response.json() as { message: string };
      expect(errorData.message).toBe('Research not found');
    });
  });

  describe('Authentication and Authorization', () => {
    test('should return 401 for unauthorized requests', async () => {
      // Call with missing auth header
      const response = await fetch(`${API_URL}/research`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // No authorization header
        }
      });

      // Verify response status
      expect(response.status).toBe(401);
      
      // Verify error message
      const errorData = await response.json() as { message: string };
      expect(errorData.message).toBe('Unauthorized access');
    });
  });
}); 