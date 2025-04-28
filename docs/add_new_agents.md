# Agent Runtime Architecture Guide

This guide outlines the architectural patterns and principles for creating agent runtime modules in the platform.

## Hexagonal Architecture Overview

The platform uses a hexagonal architecture (also known as ports and adapters) for agent runtime modules. This architecture separates the core business logic from external concerns, making the system more maintainable, testable, and adaptable to change.

These are general guidelines and patterns. 

```
<YOUR-AGENT-NAME>/
├── adapters/
│   ├── primary/    (input adapters - handle incoming requests)
│   │   ├── request-<YOUR-AGENT-NAME>.adapter.ts
│   │   └── get-<YOUR-AGENT-NAME>.adapter.ts
│   └── secondary/  (output adapters - handle outgoing operations)
│       ├── openai.adapter.ts
│       └── datastore.adapter.ts
└── usecase/      (core business logic)
    └── <YOUR-AGENT-NAME>.usecase.ts
```

## Key Architectural Concepts

### 1. Separation of Concerns

Each agent runtime module is divided into three main components:

- **Primary Adapters**: Handle incoming requests (HTTP) and transform them into a format the use cases can process
- **Use Cases**: Contain the core business logic independent of external systems
- **Secondary Adapters**: Handle communication with external systems (AI providers, databases)

### 2. Dependency Rule

Dependencies always point inward:

- Use cases don't depend on adapters
- Primary adapters depend on use cases
- Secondary adapters are called by use cases

### 3. Factory Pattern

The system uses factory functions to create standardized components:

- Lambda adapter factory for HTTP requests
- Repository factory for data access

## Implementation Patterns

### 1. Primary Adapters

Primary adapters handle incoming requests and typically:

- Parse and validate input data using schemas
- Transform external data formats into domain objects
- Call the appropriate use case
- Handle errors and return appropriate responses

Common primary adapters include:

- **HTTP Request Adapters**: Handle API Gateway events

**Example: HTTP Request Adapter (request-<YOUR-AGENT-NAME>.adapter.ts)**

```typescript
/**
 * <YOUR-AGENT-NAME> Request Adapter
 * 
 * This module provides a Lambda adapter for handling <YOUR-AGENT-NAME> requests.
 * It uses the lambda adapter factory to create a standardized Lambda handler
 * with authentication, validation, and error handling.
 */
import { randomUUID } from 'crypto';
import { 
  createLambdaAdapter, 
  EventParser,
  LambdaAdapterOptions 
} from '@lib/lambda-adapter.factory';
import { Request<YOUR-AGENT-NAME>InputSchema, Request<YOUR-AGENT-NAME>Input } from "@metadata/agents/<YOUR-AGENT-NAME>.schema";
import { OrchestratorHttpResponses } from '@metadata/http-responses.schema';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ValidUser } from '@metadata/saas-identity.schema';
import { apiKeyService } from '@utils/vendors/api-key-vendor';
import { run<YOUR-AGENT-NAME>Usecase } from '../../usecase/<YOUR-AGENT-NAME>.usecase';
import { <YOUR-AGENT-NAME>Repository } from '@agent-runtime/<YOUR-AGENT-NAME>/adapters/secondary/datastore.adapter';

/**
 * Parser function that transforms the API Gateway event into the format
 * expected by the <YOUR-AGENT-NAME> use case
 */
const <YOUR-AGENT-NAME>EventParser: EventParser<Request<YOUR-AGENT-NAME>Input> = (
  event: APIGatewayProxyEventV2,
  validUser: ValidUser
) => {
  // Parse the request body
  if (!event.body) {
    throw new Error("Missing request body");
  }
  
  const parsedBody = JSON.parse(event.body);
  
  // Generate ID if needed
  const id = randomUUID();
  
  // Return parsed input with user info
  return {
    ...parsedBody,
    id,
    userId: validUser.userId,
    keyId: validUser.keyId
  };
};

/**
 * Configuration options for the <YOUR-AGENT-NAME> adapter
 */
const adapterOptions: LambdaAdapterOptions = {
  requireAuth: true,
  requireBody: true,
  requiredFields: ['prompt'] // Required fields in the request body
};

/**
 * Decrement user credits
 */
const decrementUserCredits = async (input: { userId: string, keyId: string }) => {
  await apiKeyService.updateUserCredits({
    userId: input.userId,
    keyId: input.keyId,
    operation: 'decrement',
    amount: 1
  });
};

/**
 * Use case for handling <YOUR-AGENT-NAME> requests
 * This function:
 * 1. Decrements user credits
 * 2. Creates an initial pending state in the database
 * 3. Asynchronously processes the request
 * 4. Returns the initial state immediately
 */
const execute<YOUR-AGENT-NAME>Usecase = async (input: Request<YOUR-AGENT-NAME>Input) => {
  // Decrement credits and create pending state
  await decrementUserCredits({
    userId: input.userId,
    keyId: input.keyId
  });
  
  // Create pending entry
  const pending<YOUR-AGENT-NAME> = {
    id: input.id,
    userId: input.userId,
    // other fields as needed
    status: 'PENDING'
  };
  
  // Save pending state
  await <YOUR-AGENT-NAME>Repository.save<YOUR-AGENT-NAME>(pending<YOUR-AGENT-NAME>);
  
  // Start processing asynchronously
  run<YOUR-AGENT-NAME>Usecase(input).catch(error => {
    console.error('Error executing <YOUR-AGENT-NAME>:', error);
  });
  
  // Return pending state immediately
  return pending<YOUR-AGENT-NAME>;
};

/**
 * Lambda adapter for handling <YOUR-AGENT-NAME> requests
 */
export const request<YOUR-AGENT-NAME>Adapter = createLambdaAdapter({
  schema: Request<YOUR-AGENT-NAME>InputSchema,
  useCase: execute<YOUR-AGENT-NAME>Usecase,
  eventParser: <YOUR-AGENT-NAME>EventParser,
  options: adapterOptions,
  responseFormatter: (result) => OrchestratorHttpResponses.ACCEPTED({ body: result })
});
```

### 2. Use Cases

Use cases implement the core business logic and typically:

- Are independent of external systems
- Orchestrate the flow of data between adapters
- Implement domain-specific rules and transformations
- Return standardized response objects

**Example: Use Case (<YOUR-AGENT-NAME>.usecase.ts)**

```typescript
import { Request<YOUR-AGENT-NAME>Input } from '@metadata/agents/<YOUR-AGENT-NAME>.schema';
import { Message } from '@metadata/message.schema';
import { run<YOUR-AGENT-NAME> } from '../adapters/secondary/openai.adapter';
import { <YOUR-AGENT-NAME>Repository } from '../adapters/secondary/datastore.adapter';

export const run<YOUR-AGENT-NAME>Usecase = async (input: Request<YOUR-AGENT-NAME>Input): Promise<Message> => {
  console.info("Processing <YOUR-AGENT-NAME> for User");

  try {
    // Call the AI provider adapter to generate content
    const result = await run<YOUR-AGENT-NAME>(input);
    
    // Update status to completed
    result.status = 'COMPLETED';
    
    // Add user information
    const resultWithUserId = {
      ...result,
      userId: input.userId
    };
    
    // Save to the database
    const message = await <YOUR-AGENT-NAME>Repository.save<YOUR-AGENT-NAME>(resultWithUserId);
    
    // Return success message
    return {
      message: message
    };

  } catch (error) {
    console.error('Error processing <YOUR-AGENT-NAME>:', error);
    throw new Error('Failed to process <YOUR-AGENT-NAME>', { cause: error });
  }
};
```

### 3. Secondary Adapters

Secondary adapters handle communication with external systems and typically:

- Transform domain objects into formats required by external systems
- Handle communication details (API calls, database queries)
- Abstract away the specifics of external systems
- Provide error handling and retries

Common secondary adapters include:

- **AI Provider Adapters**: Communicate with AI services (OpenAI, etc.)
- **Datastore Adapters**: Handle persistence operations

**Example: OpenAI Adapter (openai.adapter.ts)**

```typescript
import OpenAI from "openai";
import { 
  Request<YOUR-AGENT-NAME>Input, 
  <YOUR-AGENT-NAME>Output,
  <YOUR-AGENT-NAME>OutputSchema,
  systemPrompt,
  userPrompt 
} from "@metadata/agents/<YOUR-AGENT-NAME>.schema";
import { Resource } from "sst";
import { withRetry } from "@utils/tools/retry";
import { zodToOpenAIFormat } from "@utils/vendors/openai/schema-helpers";
import { z } from "zod";

const client = new OpenAI({
  apiKey: Resource.OpenAiApiKey.value
});

export const execute<YOUR-AGENT-NAME> = async (input: Request<YOUR-AGENT-NAME>Input): Promise<<YOUR-AGENT-NAME>Output> => {
  try {
    // Create the initial response using the main model and web search
    const response = await client.responses.create({
      model: "gpt-4o",
      tools: [{
        type: "web_search_preview", 
        search_context_size: "high",
      }],
      instructions: systemPrompt,
      input: [
        {"role": "user", "content": userPrompt(input)}
      ],
      tool_choice: "required"
    });
    
    // Process and format the output
    const formattedOutput = <YOUR-AGENT-NAME>OutputSchema.parse({
      id: input.id,
      // Other fields from response
      content: response.output_text
    });
    
    return formattedOutput;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
};

// Wrap with retry logic
export const run<YOUR-AGENT-NAME> = withRetry(execute<YOUR-AGENT-NAME>, { 
  retries: 3, 
  delay: 1000, 
  onRetry: (error: Error) => console.warn('Retrying content generation due to error:', error) 
});
```

**Example: Datastore Adapter (datastore.adapter.ts)**

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { <YOUR-AGENT-NAME>OutputSchema } from "@metadata/agents/<YOUR-AGENT-NAME>.schema";
import { 
  createRepository, 
  IRepository 
} from "@lib/repository.factory";
import { z } from "zod";

// Define the output type
export type <YOUR-AGENT-NAME>Output = z.infer<typeof <YOUR-AGENT-NAME>OutputSchema>;

// Set up DynamoDB client
const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Create and export the repository
export const <YOUR-AGENT-NAME>Repository = createRepository<<YOUR-AGENT-NAME>Output>(dynamoDbClient, {
  tableName: '<YOUR-AGENT-NAME>-table',
  partitionKey: 'userId',
  sortKey: 'id',
  verbose: true
});
```

## Integration Patterns

### 1. Schema Validation

All input and output data is validated using Zod schemas:

- Input schemas define the expected request format
- Output schemas define the expected response format
- Schemas are shared between metadata and runtime components

**Example: Schema Definition (<YOUR-AGENT-NAME>.schema.ts)**

```typescript
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export enum <YOUR-AGENT-NAME>Status {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed"
}

export const Request<YOUR-AGENT-NAME>InputSchema = z.object({
  prompt: z.string(),
  id: z.string().optional().default(uuidv4()),
  userId: z.string(),
  keyId: z.string(),
});

export const systemPrompt = `
You are a <YOUR-AGENT-NAME> agent.

You are responsible for [describe responsibility].

[Include detailed instructions for the agent]
`;

export const userPrompt = (input: Request<YOUR-AGENT-NAME>Input): string => `
Process the following request:

${input.prompt}
`;

export const <YOUR-AGENT-NAME>OutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  status: z.nativeEnum(<YOUR-AGENT-NAME>Status).default(<YOUR-AGENT-NAME>Status.PENDING),
  // Add other fields as needed
});

export const Get<YOUR-AGENT-NAME>InputSchema = z.object({
  userId: z.string(),
  id: z.string(),
});

export const GetAll<YOUR-AGENT-NAME>InputSchema = z.object({
  userId: z.string(),
});

export type Request<YOUR-AGENT-NAME>Input = z.infer<typeof Request<YOUR-AGENT-NAME>InputSchema>;
export type <YOUR-AGENT-NAME>Output = z.infer<typeof <YOUR-AGENT-NAME>OutputSchema>;
export type Get<YOUR-AGENT-NAME>Input = z.infer<typeof Get<YOUR-AGENT-NAME>InputSchema>;
export type GetAll<YOUR-AGENT-NAME>Input = z.infer<typeof GetAll<YOUR-AGENT-NAME>InputSchema>;
```

### 2. Error Handling

Standardized error handling patterns:

- Primary adapters catch and transform errors into appropriate responses
- Use cases propagate domain-specific errors
- Secondary adapters handle and retry transient failures

**Example: Error Handling with Retries**

```typescript
// Error handling with retries in a secondary adapter
try {
  // Call external service
  return await withRetry(
    async () => {
      const result = await externalService.operation();
      return result;
    },
    {
      retries: 3,
      delay: 1000,
      shouldRetry: (error) => {
        // Only retry on specific error types
        return error.code === 'RATE_LIMIT' || error.code === 'TIMEOUT';
      },
      onRetry: (error, attempt) => {
        console.warn(`Retry attempt ${attempt} after error: ${error.message}`);
      }
    }
  );
} catch (error) {
  // Log with context
  console.error('External service error', { 
    error: error.message,
    service: 'external-service-name'
  });
  
  // Rethrow with domain-specific error
  throw new Error('Failed to perform operation');
}
```

### 3. Dependency Injection

Dependencies are injected rather than imported directly:

- Factories accept dependencies as parameters
- Adapters are composed at the application boundary
- This facilitates testing and flexibility

**Example: Factory with Dependency Injection**

```typescript
// Factory function with dependency injection
export const create<YOUR-AGENT-NAME>Usecase = (
  aiProvider: {
    generate: (input: Request<YOUR-AGENT-NAME>Input) => Promise<<YOUR-AGENT-NAME>Output>
  },
  repository: {
    save: (entity: <YOUR-AGENT-NAME>Output) => Promise<string>
  }
) => {
  return async (input: Request<YOUR-AGENT-NAME>Input): Promise<Message> => {
    console.info("Processing <YOUR-AGENT-NAME>");
    
    try {
      // Use injected dependencies
      const result = await aiProvider.generate(input);
      
      const entityWithUserId = {
        ...result,
        userId: input.userId
      };
      
      const message = await repository.save(entityWithUserId);
      
      return {
        message: message
      };
    } catch (error) {
      console.error('Error in <YOUR-AGENT-NAME> usecase:', error);
      throw new Error('Failed to process <YOUR-AGENT-NAME>');
    }
  };
};

// Usage in composition root
const aiProvider = {
  generate: run<YOUR-AGENT-NAME>
};

const repository = <YOUR-AGENT-NAME>Repository;

// Create the use case with dependencies
const usecase = create<YOUR-AGENT-NAME>Usecase(aiProvider, repository);
```

## Implementation Workflow

When creating a new agent runtime module:

1. **Define the domain model** in the metadata layer
2. **Implement secondary adapters** for external systems
3. **Implement use cases** for core business logic
4. **Implement primary adapters** for handling requests
5. **Register the agent** in the infrastructure

## Best Practices

1. **Single Responsibility**: Each component should have a single responsibility
2. **Immutability**: Prefer immutable data structures
3. **Pure Functions**: Minimize side effects in business logic
4. **Consistent Naming**: Follow established naming conventions
5. **Comprehensive Logging**: Include appropriate logging for debugging
6. **Error Handling**: Implement proper error handling at each layer
7. **Testing**: Write unit tests for each component

## Common Anti-patterns to Avoid

1. **Leaky Abstractions**: Don't let external concerns leak into use cases
2. **Direct Dependencies**: Don't import external services directly in use cases
3. **Inconsistent Error Handling**: Don't swallow errors without proper handling
4. **Tight Coupling**: Don't create tight coupling between components
5. **Mixed Responsibilities**: Don't mix business logic with I/O operations 