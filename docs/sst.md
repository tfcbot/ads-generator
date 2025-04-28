# SST Infrastructure Guide

This document explains how Serverless Stack (SST) is used in the project to manage infrastructure, deployments, and configuration.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup and Configuration](#setup-and-configuration)
4. [Deployment](#deployment)
5. [Secrets Management](#secrets-management)
6. [Resource Definition](#resource-definition)
7. [Local Development](#local-development)
8. [Troubleshooting](#troubleshooting)

## Overview

The project uses SST (Serverless Stack) v3 to define and deploy cloud infrastructure as code. SST v3 provides a higher-level abstraction over Pulumi and Terraform (no longer uses AWS CDK), making it easier to work with serverless resources and enables local development against cloud resources.

Key features:
- Infrastructure as code with TypeScript
- Stage-based deployments (dev, staging, prod)
- Component-based infrastructure definition
- Secrets management across environments
- Local development with Live Lambda environment

## Architecture

The SST v3 infrastructure follows a component-based approach with these main elements:

1. **Components**: Direct AWS resource definitions like APIs, databases, and queues
2. **Resources**: Reusable building blocks for your infrastructure
3. **Linking**: Connection mechanism to link resources and share configurations
4. **Secrets**: Secure environment variables across environments

```
┌───────────┐      ┌───────────┐      ┌───────────┐
│ Components│──────▶ Resources │──────▶   Links   │
└───────────┘      └───────────┘      └───────────┘
                        │                   │
                        │                   │
                        ▼                   ▼
                  ┌───────────┐      ┌───────────┐
                  │Environment│◀─────┤  Secrets  │
                  │ Variables │      └───────────┘
                  └───────────┘      
```

## Setup and Configuration

### Prerequisites

To work with SST, you need:

1. An AWS account with CLI access configured
2. Node.js installed
3. Bun installed for package management

### Project Structure

The SST configuration in this project is organized in the `/infra` directory:

```
/infra
  database.ts       # Database resource definitions
  web.ts            # Frontend and API configurations
  orchestrator.ts   # Event processing and queues
  secrets.ts        # Secret management
  index.ts          # Exports for all components
```

There's no need for a stacks directory as SST v3 uses a flat component structure instead of the stack-based approach from v2.

### Environment Setup

Create a `.env.local` file in the project root for local development:

```
# AWS/SST Configuration
AWS_PROFILE=my-profile
```

## Deployment
```
bun sst dev --stage <stage-name>
```

### Removing Deployed Resources

To remove all deployed resources for a stage:

```bash
bun sst remove --stage <stage-name>
```

## Secrets Management

SST provides a built-in secrets management system that securely stores sensitive information like API keys and database credentials.

### Setting Secrets

Use the SST CLI to set secrets for different environments:

```bash
# Set a secret for the development stage
bun sst secret set MY_SECRET_KEY my-secret-value --stage dev

# Set a secret for production
bun sst secret set MY_SECRET_KEY my-production-value --stage prod
```

### Loading Secrets from Environment Files

> **Note**: You can load secrets from a local `.env` file into SST using the following command:
>
> ```bash
> bun sst secret load .env --stage <your-stage>
> ```
>
> This is useful for bulk-loading multiple secrets at once during setup or when migrating between environments.

### Accessing Secrets in Code

In SST v3, secrets are defined in code and can be accessed throughout your application:

```typescript
// In secrets.ts
export const myApiKey = new sst.Secret("MyApiKey")

// In a Lambda function
export const handler = async () => {
  const myApiKeyValue = process.env.MY_API_KEY;
  
  // Use the secret value
  // ...
};
```

In the frontend, secrets can be linked and accessed via environment variables:

```typescript
// In web.ts
export const frontend = new sst.aws.Nextjs("MyWeb", {
  link: [api, secrets],
  environment: {
    NEXT_PUBLIC_API_KEY: myApiKey.value
  }
});
```

## Resource Definition

In SST v3, resources are defined directly as components rather than being organized into stacks. Here are examples from our actual codebase:

### Database Example

```typescript
// infra/database.ts
export const personaTable = new sst.aws.Dynamo("Persona", {
    fields: {
        userId: "string",
        personaId: "string",
        personaStatus: "string",
    },
    primaryIndex: {hashKey: "personaId"},
    globalIndexes: {
        UserIdIndex: { hashKey: "userId" },
        StatusIndex: { hashKey: "personaStatus" }
    }
})
```

### API Example

```typescript
// infra/web.ts
export const api = new sst.aws.ApiGatewayV2('BackendApi')

api.route("GET /personas", {
  link: [...apiResources],
  handler: "./packages/functions/src/agent-runtime.api.getAllUserPersonasHandler",
})

api.route("POST /personas", {
  link: [...apiResources],
  handler: "./packages/functions/src/agent-runtime.api.requestPersonaHandler",
})
```

### Event Processing Example

```typescript
// infra/orchestrator.ts
export const TaskTopic = new sst.aws.SnsTopic("TaskTopic", {
  fifo: true
})

export const personaQueue = new sst.aws.Queue("PersonaQueue")  

TaskTopic.subscribeQueue(
  "PersonaQueue", 
  personaQueue.arn, 
  {
    filter: {
      "queue": ["persona"]
    }
  }
)
```

## Local Development

SST enables local development against cloud resources:

### Starting the Dev Environment

```bash
bun run dev
```

This command starts the SST dev environment, which:
1. Deploys resources to a development environment
2. Sets up local proxies for Lambda functions
3. Enables real-time function updates during development


## Troubleshooting

### Common Issues

1. **Deployment failures**
   - Check the deployment logs in the terminal output
   - Verify your AWS credentials are correct
   - Ensure you have sufficient permissions

2. **Missing environment variables**
   - Verify secrets are set for the current stage
   - Check that resources are properly linked
   - Restart the SST dev server after adding new secrets

3. **Resource limits**
   - AWS accounts have service limits that may need to be increased
   - Check for resource-related errors in the logs


## Resources

- [SST Documentation](https://sst.dev/docs)