# Stripe Payment Integration Guide

This document explains how payments are handled in the project using Stripe. The system implements a credit-based payment model where users can purchase credits that are used for various operations like generating personas.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup and Configuration](#setup-and-configuration)
4. [Payment Flow](#payment-flow)
5. [Webhooks](#webhooks)
6. [Frontend Integration](#frontend-integration)
7. [Troubleshooting](#troubleshooting)

## Overview

The payment system uses Stripe to process credit purchases. When a user buys credits, they are redirected to a Stripe checkout page. After successful payment, Stripe sends a webhook notification, and the system adds credits to the user's account.

Key features:
- Credit-based payment model
- Secure payment processing with Stripe
- Webhook integration for automated credit fulfillment
- User credit tracking and management

## Architecture

The payment system follows a clean architecture approach with the following components:

1. **Frontend**: Provides UI for initiating checkout and displays user's credit balance
2. **Backend API**: Handles checkout session creation and webhook processing
3. **Stripe Service**: Creates checkout sessions and processes payments
4. **Credit Management**: Updates user credit balances

```
┌───────────┐      ┌───────────┐      ┌───────────┐
│  Frontend │──────▶   API     │──────▶  Stripe   │
└───────────┘      └───────────┘      └───────────┘
                         │                   │
                         ▼                   │
                  ┌───────────┐             │
                  │  Credit   │◀────────────┘
                  │ Management│  (Webhooks)
                  └───────────┘
```

## Setup and Configuration

### Environment Variables

The following environment variables must be configured:

```
# Stripe Configuration
StripeSecretKey=your_stripe_secret_key_here
StripePublishableKey=your_stripe_publishable_key_here
StripeWebhookSecret=your_stripe_webhook_secret_here
```

### Obtaining Stripe Keys

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Navigate to the Developers → API keys section in the Stripe Dashboard
3. Copy the publishable key and secret key
4. Set up a webhook endpoint and copy the webhook signing secret

## Payment Flow

### 1. Initiating Checkout

When a user wants to purchase credits, the frontend calls the `/checkout` endpoint. The server creates a Stripe checkout session and returns the session ID.

**Frontend (React hook):**
```typescript
// packages/frontend/src/hooks/useCheckout.ts
export function useCheckout() {
  // ...
  const startCheckout = async () => {
    // Get authentication token
    const token = await getAuthToken();
    
    // Call backend to create checkout session
    const id = await initiateCheckout(token);
    
    // Load Stripe and redirect to checkout
    const stripe = await loadStripe(stripeKey);
    await stripe.redirectToCheckout({ sessionId: id });
  };
  // ...
}
```

**Backend (Checkout Session Creation):**
```typescript
// packages/core/src/orchestrator/billing/adapters/secondary/stripe.adapter.ts
export async function createSession(params: CheckoutSessionInput) {
  const stripe = Stripe(stripeSecretKey);
  
  // Include metadata for webhook processing
  const metadataRefill = {
    userId: params.userId,
    keyId: params.keyId,
    amount: "100",  // Credits to be added
  };
  
  // Create a Stripe checkout session
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

### 2. Stripe Checkout

The user is redirected to Stripe's hosted checkout page where they enter their payment information. This page is hosted by Stripe and complies with PCI requirements.

### 3. Payment Processing

Stripe processes the payment and redirects the user back to the application's success URL.

### 4. Credit Fulfillment

After successful payment, Stripe sends a webhook notification to the application's webhook endpoint. The application processes this webhook and adds credits to the user's account.

## Webhooks

Webhooks are used to automatically add credits to a user's account after a successful payment. Stripe sends an event notification to the webhook endpoint configured in the Stripe dashboard.

### Webhook Setup

1. In the Stripe Dashboard, navigate to Developers → Webhooks
2. Add an endpoint URL: `https://your-api-domain.com/stripe-webhook`
3. Select the `checkout.session.completed` event
4. Copy the webhook signing secret for your environment variables

### Webhook Processing

The webhook handler:
1. Verifies the Stripe signature to ensure the request is legitimate
2. Processes the checkout session completed event
3. Updates the user's credit balance

```typescript
// packages/core/src/orchestrator/billing/adapters/primary/webhook.adapter.ts
export const webhookAdapter = async (event: APIGatewayProxyEventV2) => {
  // Extract Stripe signature from headers
  const signature = event.headers['stripe-signature'];
  
  // Verify webhook signature
  const stripeEvent = stripe.webhooks.constructEvent(
    event.body,
    signature,
    webhookSecret
  );
  
  // Process the webhook event
  const result = await processWebhookUseCase(stripeEvent);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ received: true, result })
  };
};
```

**Webhook Processing Logic:**
```typescript
// packages/core/src/orchestrator/billing/usecases/process-webhook.usecase.ts
export async function processWebhookUseCase(event: any) {
  switch (event.type) {
    case 'checkout.session.completed':
      return await handleCheckoutSessionCompleted(event.data.object);
    default:
      return { status: 'ignored', event: event.type };
  }
}

async function handleCheckoutSessionCompleted(session: CheckoutSessionCompleted) {
  // Extract metadata from the session
  const userId = session.metadata.userId;
  const amount = session.metadata.amount ? Number(session.metadata.amount) : 5;
  const keyId = session.metadata.keyId;
  
  // Update user credits
  const result = await apiKeyAdapter.updateUserCredits({
    userId,
    keyId,
    operation: 'increment',
    amount
  });
  
  return {
    status: 'success',
    userId,
    credits: amount,
    newTotal: result.credits
  };
}
```

## Frontend Integration

The frontend needs to:
1. Display the user's current credit balance
2. Provide a button/interface to purchase more credits
3. Handle the checkout process

### Credit Display Component

```jsx
const CreditDisplay = ({ credits }) => {
  return (
    <div className="credit-display">
      <p>Available Credits: {credits}</p>
    </div>
  );
};
```

### Purchase Button Component

```jsx
const PurchaseButton = () => {
  const { startCheckout, isLoading, error } = useCheckout();
  
  return (
    <div className="purchase-button">
      <button 
        onClick={startCheckout} 
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Purchase Credits'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};
```

## Troubleshooting

### Common Issues

1. **Webhook verification failures**
   - Ensure the webhook secret is correctly configured
   - Check that the endpoint is accessible by Stripe

2. **Credits not being added after payment**
   - Verify webhook events are being received
   - Check logs for errors in the webhook processing
   - Ensure user and key IDs are correctly included in the session metadata

3. **Stripe checkout not loading**
   - Verify the Stripe publishable key is correct
   - Check browser console for JavaScript errors

### Testing Stripe Integration

For testing:
1. Use Stripe's test card numbers (e.g., 4242 4242 4242 4242)
2. Set your Stripe account to test mode
3. Use Stripe's webhook testing tools to simulate events

### Logging and Monitoring

All Stripe-related operations are logged. To troubleshoot issues:
1. Check application logs for error messages
2. Verify events in the Stripe Dashboard under Events
3. Test webhook deliveries using the Stripe CLI

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)