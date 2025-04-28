# Credit Management with Unkey

This document explains how credit management is implemented in the project using Unkey. The system implements a credit-based model where users have credits that are consumed by various operations like generating personas.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup and Configuration](#setup-and-configuration)
4. [Credit Operations](#credit-operations)
5. [Unkey Integration](#unkey-integration)
6. [Stripe Integration](#stripe-integration)
7. [API Endpoints](#api-endpoints)
8. [Troubleshooting](#troubleshooting)

## Overview

The credit management system uses [Unkey](https://unkey.dev) to handle API key generation and credit tracking. Each user is assigned an API key with a credit balance. When operations are performed, credits are deducted from this balance. Users can purchase additional credits via Stripe integration.

Key features:
- Credit-based usage model
- User API key management with Unkey
- Credit purchase through Stripe
- Automatic credit fulfillment via webhooks
- Credit balance tracking and verification

## Architecture

The credit management system follows a clean architecture approach with the following components:

1. **API Key Service**: Manages API keys through Unkey
2. **Billing Service**: Handles payment processing with Stripe
3. **Credit Management**: Updates and tracks user credit balances
4. **Webhooks**: Processes events for credit fulfillment

```
┌───────────┐      ┌───────────┐      ┌───────────┐
│   User    │──────▶ API Keys  │──────▶   Unkey   │
└───────────┘      └───────────┘      └───────────┘
      │                  │                  │
      │                  │                  │
      ▼                  ▼                  ▼
┌───────────┐      ┌───────────┐      ┌───────────┐
│   Stripe  │──────▶  Webhook  │──────▶  Credits  │
└───────────┘      └───────────┘      └───────────┘
```

## Setup and Configuration

### Environment Variables

The following environment variables must be configured for credit management:

```
# Unkey Configuration
UnkeyRootKey=your_unkey_root_key_here
UnkeyApiId=your_unkey_api_id_here

# Stripe Configuration (for credit purchases)
StripeSecretKey=your_stripe_secret_key_here
StripePublishableKey=your_stripe_publishable_key_here
StripeWebhookSecret=your_stripe_webhook_secret_here
```

### Setting Up Unkey

1. Create an account on [Unkey](https://unkey.dev)
2. Create a new API for your application
3. Note the API ID provided by Unkey
4. Generate a root key for API management
5. Configure the environment variables above with your Unkey credentials

## Credit Operations

The system provides several operations for managing credits:

### Incrementing Credits

Credits are increased when:
- A user purchases credits through Stripe
- Credits are manually added by an administrator
- A promotional credit is applied

### Decrementing Credits

Credits are decreased when:
- A user generates a persona
- Any credit-consuming operation is performed

### Checking Credit Balance

The system provides API endpoints to:
- Check the current credit balance
- View credit transaction history

## Unkey Integration

### API Key Generation

When a new user signs up, the system automatically creates an API key through Unkey:

```typescript
async generateApiKeys(userId: string): Promise<string> {
  console.info("Generating API keys for user:", userId);
  try {
    // Use the Unkey service to generate a secure API key
    const result = await apiKeyService.createApiKey({
      userId,
      name: `API Key for ${userId}`,
    });
    
    console.info("API key generated successfully for user:", userId);
    
    return result.keyId;
  } catch (error) {
    console.error("Error generating API key:", error);
    throw new Error("Failed to generate API key");
  }
}
```

The API key is created with a default credit balance of 100:

```typescript
async createApiKey(params: { userId: string, name?: string, expires?: Date }) {
  console.log("Creating API key for user:", params.userId);
  const result = await this.unkey.keys.create({
    apiId: this.apiId,
    name: params.name || `API Key for ${params.userId}`,
    ownerId: params.userId,
    remaining: 100, // Default credit balance
    meta: {
      userId: params.userId,
    },
  });

  if (!result.result) {
    throw new Error("Failed to create API key: " + result.error);
  }

  await this.apiKeyRepository.saveApiKey({
    keyId: result.result.keyId,
    userId: params.userId,
    name: params.name,
    expires: params.expires?.toISOString(),
  });

  return {
    key: result.result.key,
    keyId: result.result.keyId,
  };
}
```

### Updating Credits

Credits can be updated using the Unkey API:

```typescript
async updateUserCredits(command: UpdateUserCreditsCommand): Promise<{ credits: number }> {
  console.log('Updating user credits for user:', command.userId, 'operation:', command.operation, 'amount:', command.amount);
  
  try {
    if (!command.keyId) {
      // Get the user's active API key
      const { result: userResponse } = await this.unkey.apis.listKeys({
        apiId: this.apiId,
        ownerId: command.userId,
        limit: 1
      });
      
      if (!userResponse?.keys || userResponse.keys.length === 0) {
        throw new Error('User has no API keys');
      }
      
      command.keyId = userResponse.keys[0].id;
    }
    
    // Update the remaining credits on the API key
    const { result, error } = await this.unkey.keys.updateRemaining({
      keyId: command.keyId,
      op: command.operation === 'increment' ? 'increment' : 'decrement',
      value: command.amount
    });
    
    if (error) {
      throw new Error(`Failed to update credits: ${error.message}`);
    }
    
    const newCredits = result.remaining || 0;
    
    return { credits: newCredits };
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
}
```

### Getting Credit Balance

The system can retrieve the current credit balance for a user:

```typescript
async getRemainingCredits(keyId: string): Promise<number> {
  try {
    const { result, error } = await this.unkey.keys.get({ keyId });
    
    if (error) {
      throw new Error(`Failed to get key: ${error.message}`);
    }
    
    return result.remaining || 0;
  } catch (error) {
    console.error('Error getting remaining credits:', error);
    throw error;
  }
}
```

## Stripe Integration

The credit system integrates with Stripe for payment processing. When a user purchases credits, the following flow occurs:

### 1. Initiating Checkout

The frontend initiates a checkout session by calling the `/checkout` endpoint:

```typescript
export async function createSession(params: CheckoutSessionInput) {
  console.log('Creating checkout session for user:', params.userId);
  const stripeSecretKey = Resource.StripeSecretKey.value;
  const stripe = Stripe(stripeSecretKey);
  const metadataRefill: MetadataRefill = {
    userId: params.userId,
    keyId: params.keyId,
    amount: "100", // Credits to be added
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Credits',
            description: `${creditsPerUnit} Credits`,
          },
          unit_amount: 100, // $1.00 per unit
        },
        quantity: params.quantity,
      },
    ],
    mode: 'payment',
    success_url: `${appDomain}/`,
    cancel_url: `${appDomain}/`,
    metadata: metadataRefill,
  });

  return { id: session.id };
}
```

### 2. Webhook Processing

After a successful payment, Stripe sends a webhook to the `/stripe-webhook` endpoint. The webhook handler processes this event and adds credits to the user's account:

```typescript
async function handleCheckoutSessionCompleted(session: CheckoutSessionCompleted) {
  console.log('Handling checkout session completed:', session.id);
  
  try {
    if (!session.metadata || !session.metadata.userId || !session.metadata.keyId) {
      throw new Error('Missing userId or keyId in session metadata');
    }
    
    const userId = session.metadata.userId;
    const amount = session.metadata.amount ? Number(session.metadata.amount) : 5; // Default to 5 credits
    const keyId = session.metadata.keyId;
    const result = await apiKeyAdapter.updateUserCredits({
      userId,
      keyId: session.metadata.keyId,
      operation: 'increment',
      amount
    });
    
    return {
      status: 'success',
      userId,
      credits: amount,
      newTotal: result.credits
    };
  } catch (error) {
    console.error('Error handling checkout session:', error);
    throw error;
  }
}
```

## API Endpoints

The system exposes several API endpoints for credit management:

### Get User Credits

```
GET /credits
```

Retrieves the user's current credit balance:

```typescript
export const getUserCreditsAdapter = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const svm = new SaaSIdentityVendingMachine();
    const validUser = await svm.getValidUser(event);
    
    const params: GetUserCreditsInput = GetUserCreditsInputSchema.parse({
      userId: validUser.userId,
      keyId: validUser.keyId
    });
    
    const result = await getUserCreditsUseCase(params);
    
    // Validate the response with our schema
    const creditsResponse = UserCreditsResponseSchema.parse(result);
    
    // Create standardized API response
    const apiResponse = createApiResponse(
      creditsResponse,
      'User credits retrieved successfully'
    );

    return OrchestratorHttpResponses.OK({
      body: apiResponse
    });
  } catch (error) {
    console.error('Error getting user credits:', error);
    return OrchestratorHttpResponses.INTERNAL_SERVER_ERROR({
      body: createApiResponse(
        null, 
        error instanceof Error ? error.message : 'Error getting user credits',
        'error'
      )
    });
  }
};
```

### Create API Key

```
POST /api-keys
```

Creates a new API key for a user with a default credit balance.

### Checkout Session

```
POST /checkout
```

Initiates a Stripe checkout session for purchasing credits.

### Stripe Webhook

```
POST /stripe-webhook
```

Processes Stripe webhook events for credit fulfillment.

## Troubleshooting

### Common Issues

1. **Missing credits after purchase**
   - Verify the webhook is properly configured in Stripe
   - Check Stripe webhook logs for errors
   - Ensure the keyId and userId are correctly included in session metadata

2. **API key validation failures**
   - Verify Unkey credentials are correct
   - Check that the API ID is correctly configured
   - Ensure the user has a valid API key

3. **Credit deduction issues**
   - Check for errors in the credit update operation
   - Verify the user has sufficient credits before operations
   - Check Unkey logs for any API errors

### Debugging Tips

1. **Checking Unkey Status**
   - Verify the Unkey service is operational
   - Check the API key exists in the Unkey dashboard
   - Validate the remaining credits value

2. **Monitoring Credit Operations**
   - Review logs for credit update operations
   - Check for errors in the updateUserCredits function
   - Verify webhook processing for credit purchases

3. **Testing Credit Flow**
   - Use test credit cards for Stripe checkout
   - Verify webhook delivery with Stripe CLI
   - Test credit balance retrieval with the /credits endpoint

## Resources

- [Unkey Documentation](https://unkey.dev/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Webhook Testing](https://stripe.com/docs/webhooks/test) 