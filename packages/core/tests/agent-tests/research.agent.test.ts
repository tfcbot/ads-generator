import { citationsSchema, RequestResearchInputSchema, RequestResearchOutputSchema, systemPrompt, userPromt } from '@metadata/agents/research-agent.schema';
import { zodToOpenAIFormat } from '@utils/vendors/openai/schema-helpers';
import { describe, expect, test, mock } from 'bun:test';
import OpenAI from 'openai';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';


describe('Research Agent Schema Validation', () => {
  const validInput = {
    prompt: 'Explain the recent developments in large language models and their applications.'
  };

  const validOutput = {
    researchId: 'test-id-123',
    title: 'Recent Developments in LLMs',
    content: 'This is a research content about large language models and their applications. It contains information about recent advancements and use cases.',
    citation_links: ['https://example.com', 'https://example2.com']
  };

  test('should validate input against schema', () => {
    // Verify that the test input is valid according to the schema
    expect(() => RequestResearchInputSchema.parse(validInput)).not.toThrow();
  });

  test('should reject invalid input missing required fields', () => {
    // Test with empty object - should fail validation
    expect(() => RequestResearchInputSchema.parse({})).toThrow();
    
    // Test with null prompt - should fail validation
    expect(() => RequestResearchInputSchema.parse({ prompt: null })).toThrow();
    
    // Test with empty prompt - should still pass as it's a string
    expect(() => RequestResearchInputSchema.parse({ prompt: '' })).not.toThrow();
  });

  test('should validate output against schema', () => {
    // Verify that the test output is valid according to the schema
    expect(() => RequestResearchOutputSchema.parse(validOutput)).not.toThrow();
  });

  test('should reject invalid output missing required fields', () => {
    // Missing researchId
    expect(() => RequestResearchOutputSchema.parse({
      title: 'Test Title',
      content: 'Test Content',
      citation_links: ['https://example.com']
    })).toThrow();
    
    // Missing title
    expect(() => RequestResearchOutputSchema.parse({
      researchId: 'test-id',
      content: 'Test Content',
      citation_links: ['https://example.com']
    })).toThrow();
    
    // Missing content
    expect(() => RequestResearchOutputSchema.parse({
      researchId: 'test-id',
      title: 'Test Title',
      citation_links: ['https://example.com']
    })).toThrow();
    
    // Missing citation_links
    expect(() => RequestResearchOutputSchema.parse({
      researchId: 'test-id',
      title: 'Test Title',
      content: 'Test Content'
    })).toThrow();
  });

  test('should require specific data types for each field', () => {
    // researchId must be string
    expect(() => RequestResearchOutputSchema.parse({
      ...validOutput,
      researchId: 123
    })).toThrow();
    
    // title must be string
    expect(() => RequestResearchOutputSchema.parse({
      ...validOutput,
      title: 123
    })).toThrow();
    
    // content must be string
    expect(() => RequestResearchOutputSchema.parse({
      ...validOutput,
      content: 123
    })).toThrow();
    
    // citation_links must be array of strings
    expect(() => RequestResearchOutputSchema.parse({
      ...validOutput,
      citation_links: 'https://example.com'
    })).toThrow();
  });

  test('should return a research output', async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    console.debug('Starting research test with API key:', apiKey ? 'Present' : 'Missing');

    const client = new OpenAI({
      apiKey
    });

    const validInputWithId = {
      ...validInput,
      id: randomUUID()
    };
   

    // Add breakpoint here before API calls

    const response = await client.responses.create({
      model: "gpt-4o",
      tools: [{
        type: "web_search_preview", 
        search_context_size: "high",
      }],
      instructions: systemPrompt,
      input: [
        {"role": "user", "content": userPromt(validInputWithId)}
      ],
      tool_choice: "required"
    });
    
    const title = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {"role": "user", "content": `Generate a title for the following research: ${response.output_text}`}
      ],
    });
   

    const extractCitations = await client.responses.create({
      model: "gpt-4o",
      input: [
        {"role": "user", "content": `Extract the citations from the following research: ${response.output_text}`}
      ], 
      text: zodToOpenAIFormat(citationsSchema, "citation_links")
    });
   
    const citations = citationsSchema.parse(JSON.parse(extractCitations.output_text) );
    const content = RequestResearchOutputSchema.parse({
      researchId: validInputWithId.id,
      title: title.output_text,
      content: response.output_text,
      citation_links: citations.links
    });
    
  }, {timeout: 50000});

}); 

interface WebSearchMetadata {
  url: string;
  title: string;
  snippet: string;
}

interface WebSearchToolCall {
  type: 'web_search';
  web_search?: {
    metadata: WebSearchMetadata;
  };
}