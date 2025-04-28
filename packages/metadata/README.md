# Metadata

This directory contains schema definitions, type declarations, and metadata for various entities within the system.

## Directory Structure

- **agents/** - Contains schema definitions specific to different agents in the system.
- **base.schema.ts** - Defines base schema types that are extended by other schemas.
- **credits.schema.ts** - Defines the schema for credit-related entities.
- **http-responses.schema.ts** - Defines standardized HTTP response schemas.
- **orchestrator.schema.ts** - Defines schemas related to the orchestrator.
- **orders.schema.ts** - Defines schemas for order entities.
- **task.schema.ts** - Defines schemas for task entities.
- **user.schema.ts** - Defines schemas for user entities.

## Purpose

The metadata directory serves as a central repository for:

1. Type definitions and schemas used throughout the application
2. Data validation schemas using Zod
3. Standardized response formats
4. Entity relationship definitions
5. API contract definitions

## When to Add Files Here

Add files to this directory when:

- Defining new entity schemas
- Creating type definitions for new features
- Standardizing response formats for new API endpoints
- Defining validation rules for data structures
- Creating shared types used across multiple components

## Best Practices

1. Use Zod for schema validation and type inference
2. Keep schemas focused on a single entity or related group of entities
3. Maintain backward compatibility when updating schemas
4. Document schema properties with clear descriptions
5. Use consistent naming conventions across all schema files
6. Organize agent-specific schemas in the agents/ subdirectory
7. Extend base schemas when appropriate to maintain consistency 