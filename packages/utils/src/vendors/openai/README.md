# OpenAI Utilities

This folder contains utility functions for working with the OpenAI API. These utilities make it easier to:

1. Format Zod schemas for the OpenAI Responses API
2. Create and manage tool definitions
3. Handle tool calls and responses

## Schema Helpers

The `schema-helpers.ts` file provides utilities for working with Zod schemas in the OpenAI Responses API.

### `zodToOpenAIFormat`

Converts a Zod schema to the format required by the OpenAI Responses API.

```typescript
import { z } from 'zod';
import { zodToOpenAIFormat } from '@utils/openai/schema-helpers';

// Define your schema
const MySchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email().optional()
});

// Convert to OpenAI format
const responseFormat = zodToOpenAIFormat(MySchema, 'user_data');

// Use in OpenAI API
const response = await client.responses.create({
  model: "o3-mini",
  input: [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Generate user data"}
  ],
  text: responseFormat
});

// Parse the response
const data = JSON.parse(response.output_text);
```

## Tool Helpers

The `tool-helpers.ts` file provides utilities for working with OpenAI's function calling capabilities.

### Creating Tool Definitions

```typescript
import { z } from 'zod';
import { createTool, createTools } from '@utils/openai/tool-helpers';

// Define a schema for your function parameters
const WeatherParamsSchema = z.object({
  location: z.string().describe("City and country e.g. Bogotá, Colombia")
});

// Create a single tool
const weatherTool = createTool({
  name: "get_weather",
  description: "Get current temperature for a given location.",
  parameters: WeatherParamsSchema
});

// Or create multiple tools at once
const tools = createTools([
  {
    name: "get_weather",
    description: "Get current temperature for a given location.",
    parameters: WeatherParamsSchema
  },
  {
    name: "search_products",
    description: "Search for products in the catalog",
    parameters: z.object({
      query: z.string(),
      category: z.string().optional(),
      maxResults: z.number().int().positive().optional()
    })
  }
]);
```

### Handling Tool Calls

```typescript
import { 
  createTool, 
  extractToolCalls, 
  executeToolCalls 
} from '@utils/openai/tool-helpers';

// Define your tool implementations
const toolImplementations = {
  get_weather: async (args: { location: string }) => {
    // Implement weather lookup logic
    const temperature = await fetchWeatherData(args.location);
    return { temperature, unit: 'celsius', location: args.location };
  },
  search_products: async (args: { query: string, category?: string, maxResults?: number }) => {
    // Implement product search logic
    const products = await searchProducts(args.query, args.category, args.maxResults);
    return { products };
  }
};

// In your API handler
async function handleUserRequest(userMessage: string) {
  // Initial request with tools
  const response = await client.responses.create({
    model: "o3-mini",
    input: [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": userMessage}
    ],
    tools: tools // Tools created with createTools
  });

  // Check if the model wants to call tools
  const toolCalls = extractToolCalls(response);
  if (toolCalls && toolCalls.length > 0) {
    // Execute all tool calls
    const toolResponses = await executeToolCalls(toolCalls, toolImplementations);
    
    // Send tool responses back to OpenAI
    const followUpResponse = await client.responses.create({
      model: "o3-mini",
      input: [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": userMessage},
        {"role": "assistant", "content": null, "tool_calls": toolCalls},
        ...toolResponses.map(resp => ({
          "role": "tool",
          "tool_call_id": resp.tool_call_id,
          "content": resp.output
        }))
      ]
    });
    
    // Return the final response to the user
    return followUpResponse.output_text;
  }
  
  // If no tool calls, return the original response
  return response.output_text;
}
```

## Complete Example

Here's a complete example showing how to use both schema and tool helpers:

```typescript
import { z } from 'zod';
import { zodToOpenAIFormat } from '@utils/openai/schema-helpers';
import { createTool, extractToolCalls, executeToolCalls } from '@utils/openai/tool-helpers';

// Define your schema for the response
const ResponseSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()).optional()
});

// Define your tool schema
const WeatherParamsSchema = z.object({
  location: z.string().describe("City and country e.g. Bogotá, Colombia")
});

// Create your tool
const weatherTool = createTool({
  name: "get_weather",
  description: "Get current temperature for a given location.",
  parameters: WeatherParamsSchema
});

// Define your tool implementation
const toolImplementations = {
  get_weather: async (args: { location: string }) => {
    const temperature = await fetchWeatherData(args.location);
    return { temperature, unit: 'celsius', location: args.location };
  }
};

// In your API handler
async function handleUserRequest(userMessage: string) {
  // Initial request with tools and response format
  const response = await client.responses.create({
    model: "o3-mini",
    input: [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": userMessage}
    ],
    tools: [weatherTool],
    text: zodToOpenAIFormat(ResponseSchema, 'response')
  });

  // Check if the model wants to call tools
  const toolCalls = extractToolCalls(response);
  if (toolCalls && toolCalls.length > 0) {
    // Execute all tool calls
    const toolResponses = await executeToolCalls(toolCalls, toolImplementations);
    
    // Send tool responses back to OpenAI
    const followUpResponse = await client.responses.create({
      model: "o3-mini",
      input: [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": userMessage},
        {"role": "assistant", "content": null, "tool_calls": toolCalls},
        ...toolResponses.map(resp => ({
          "role": "tool",
          "tool_call_id": resp.tool_call_id,
          "content": resp.output
        }))
      ],
      text: zodToOpenAIFormat(ResponseSchema, 'response')
    });
    
    // Parse and return the final response
    return JSON.parse(followUpResponse.output_text);
  }
  
  // If no tool calls, parse and return the original response
  return JSON.parse(response.output_text);
}
```

## Best Practices

1. **Use Zod Schemas**: Define your schemas using Zod for type safety and validation
2. **Descriptive Tool Names**: Use clear, descriptive names for your tools
3. **Add Descriptions**: Add detailed descriptions to your schema fields using `.describe()`
4. **Error Handling**: Implement proper error handling in your tool implementations
5. **Type Safety**: Use TypeScript types for your tool implementations
6. **Validation**: Validate inputs and outputs to ensure data integrity 