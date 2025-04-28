# Core Library Components

This directory contains reusable factory patterns and base classes that provide standardized implementations for common functionality across the application.

## Directory Structure

- **dynamodb-repository.factory.ts** - Base repository for DynamoDB operations
- **deliverable-repository.factory.ts** - Generic repository for deliverables across agents
- **sqs-adapter.factory.ts** - Factory for creating SQS adapters
- **lambda-adapter.factory.ts** - Factory for creating Lambda adapters
- **order-processor.factory.ts** - Factory for processing orders

## Purpose

The lib directory serves as a central repository for:

1. Reusable factory patterns
2. Base classes for common functionality
3. Standardized implementations for data access
4. Adapters for external services
5. Utility functions and helpers

## When to Add Files Here

Add files to this directory when:

- Creating reusable patterns that will be used across multiple components
- Implementing adapters for external services
- Developing base classes that will be extended by specific implementations
- Building utility functions that provide common functionality
- Standardizing access patterns for databases or external services

## Best Practices

1. **Type Safety**: Always provide explicit types for your entities and output types
2. **Consistent Naming**: Use consistent naming conventions for your methods
3. **Error Handling**: Customize error messages for better debugging
4. **Documentation**: Document any custom methods or behavior
5. **Delegation**: When extending base classes, delegate standard methods to the generic implementation
6. **Dependency Injection**: Use dependency injection for services and adapters
7. **Single Responsibility**: Keep each factory or base class focused on a single responsibility
8. **Testability**: Design components to be easily testable

## Available Factories

- **dynamodb-repository.factory.ts** - Base repository for DynamoDB operations
- **deliverable-repository.factory.ts** - Generic repository for deliverables across agents
- **sqs-adapter.factory.ts** - Factory for creating SQS adapters
- **lambda-adapter.factory.ts** - Factory for creating Lambda adapters
- **order-processor.factory.ts** - Factory for processing orders

## Deliverable Repository Factory

The `deliverable-repository.factory.ts` provides a generic implementation for managing deliverables across different agents. It extends the base DynamoDB repository to provide standardized access to the Deliverables table while allowing for agent-specific customization.

### Key Features

- Generic type support for agent-specific deliverable types
- Standardized methods for saving and retrieving deliverables
- Consistent error handling and logging
- Configurable options for agent-specific customization

### Basic Usage

```typescript
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DeliverableDTO, BlogToVideoOutput } from "@metadata/agents/blog-to-video.schema";
import { createDeliverableRepository, IDeliverableRepository } from "@lib/deliverable-repository.factory";

// Create a repository for Blog to Video deliverables
export const createDeliverableRepository = (
  dbClient: DynamoDBDocumentClient
): IDeliverableRepository<DeliverableDTO, BlogToVideoOutput> => {
  return createDeliverableRepository<DeliverableDTO, BlogToVideoOutput>(
    dbClient, 
    {
      agentName: 'Blog-To-Video',
      verbose: true,
      errorMessages: {
        notFound: "Blog to Video deliverable not found",
        saveFailed: "Failed to save blog to video deliverable",
        getFailed: "Failed to get blog to video deliverable"
      }
    }
  );
};
```

### Extended Usage with Custom Methods

For agents that need additional functionality beyond the standard methods, you can create a custom repository that extends or wraps the generic repository:

```typescript
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DeliverableDTO, TechStrategySchema } from "../../metadata/technical-strategist.schema";
import { createDeliverableRepository, IDeliverableRepository } from "@lib/deliverable-repository.factory";
import { z } from "zod";

// Define the output type
export type TechStrategyOutput = z.infer<typeof TechStrategySchema>;

// Extended interface with additional methods
export interface ITechStrategyDeliverableRepository extends IDeliverableRepository<DeliverableDTO, TechStrategyOutput> {
  getDeliverablesByUserId(userId: string): Promise<DeliverableDTO[]>;
}

// Custom repository implementation
class TechStrategyDeliverableRepository implements ITechStrategyDeliverableRepository {
  private genericRepository: IDeliverableRepository<DeliverableDTO, TechStrategyOutput>;
  
  constructor(private dbClient: DynamoDBDocumentClient) {
    this.genericRepository = createDeliverableRepository<DeliverableDTO, TechStrategyOutput>(
      dbClient, 
      {
        agentName: 'Technical-Strategist',
        verbose: true
      }
    );
  }
  
  // Standard methods delegated to the generic repository
  async saveDeliverable(deliverable: DeliverableDTO): Promise<void> {
    return this.genericRepository.saveDeliverable(deliverable);
  }
  
  async getDeliverable(deliverableId: string): Promise<TechStrategyOutput> {
    return this.genericRepository.getDeliverable(deliverableId);
  }
  
  // Custom method specific to this repository
  async getDeliverablesByUserId(userId: string): Promise<DeliverableDTO[]> {
    // Access the underlying BaseRepository methods
    const baseRepo = this.genericRepository as any;
    return baseRepo.query('userId', userId);
  }
}

// Factory function
export const createDeliverableRepository = (
  dbClient: DynamoDBDocumentClient
): ITechStrategyDeliverableRepository => {
  return new TechStrategyDeliverableRepository(dbClient);
}; 