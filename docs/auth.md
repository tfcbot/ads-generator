# Clerk Authentication Integration Guide

This document explains how authentication is handled in the project using Clerk. The system implements a secure user authentication flow that protects routes and resources.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup and Configuration](#setup-and-configuration)
4. [Authentication Flow](#authentication-flow)
5. [Webhooks](#webhooks)
6. [Frontend Integration](#frontend-integration)
7. [Backend Integration](#backend-integration)
8. [Troubleshooting](#troubleshooting)

## Overview

The authentication system uses Clerk to handle user identity and access control. When a user attempts to access a protected route, they are redirected to a sign-in page. After successful authentication, users can access protected resources based on their permissions.

Key features:
- Secure authentication with Clerk
- Protected routes with middleware
- Webhook integration for user lifecycle events
- JWT validation for backend API requests

## Architecture

The authentication system follows a clean architecture approach with the following components:

1. **Frontend**: Provides UI for authentication and checks user state
2. **Middleware**: Protects routes and redirects unauthenticated users
3. **Backend API**: Validates authentication tokens for API requests
4. **Webhook Handler**: Processes user lifecycle events from Clerk

```
┌───────────┐      ┌───────────┐      ┌───────────┐
│  Frontend │──────▶ Middleware│──────▶   Clerk   │
└───────────┘      └───────────┘      └───────────┘
      │                                     │
      │                                     │
      ▼                                     ▼
┌───────────┐                        ┌───────────┐
│ Backend   │◀───JWT Validation──────┤  Webhook  │
│   API     │                        │  Handler  │
└───────────┘                        └───────────┘
```

## Setup and Configuration

### Environment Variables

The following environment variables must be configured:

```
# Clerk Configuration
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### Setting Up Secrets in SST

The application uses SST secrets to manage Clerk credentials. Configure these before deployment:

```bash
# Set the Clerk publishable key
npx sst secrets set ClerkClientPublishableKey pk_test_...

# Set the Clerk secret key
npx sst secrets set ClerkClientSecretKey sk_test_...

# Set the Clerk webhook secret
npx sst secrets set ClerkWebhookSecret whsec_...
```

### Obtaining Clerk Keys

1. Create a [Clerk account](https://clerk.com)
2. Create a new application in the Clerk dashboard
3. Navigate to the API Keys section in your application settings
4. Copy the publishable key and secret key
5. Set up a webhook endpoint and copy the webhook signing secret

## Authentication Flow

### 1. Route Protection

When a user attempts to access a protected route, the middleware checks if they are authenticated. If not, they are redirected to the sign-in page.

**Middleware Configuration:**
```typescript
// packages/frontend/src/middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/about", "/login"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

By default this is left blank and for you to implement. 

### 2. User Authentication

The user signs in using Clerk's authentication UI. Clerk handles the authentication process and creates a session.

### 3. Protected Access

After successful authentication, the user can access protected routes and resources. The Clerk session provides user information to the application.

**Protected Component Example:**
```typescript
// packages/frontend/src/components/ProtectedComponent.tsx
import { useAuth } from "@clerk/nextjs";

export function ProtectedComponent() {
  const { isLoaded, userId, sessionId } = useAuth();
  
  if (!isLoaded || !userId) {
    return <div>Loading or not authenticated...</div>;
  }
  
  return (
    <div>
      <h1>Protected Content</h1>
      <p>User ID: {userId}</p>
    </div>
  );
}
```

### 4. API Authentication

API requests are authenticated using JWT tokens issued by Clerk. The backend validates these tokens before processing requests.

## Webhooks

Webhooks are used to automatically handle user lifecycle events such as user creation, updates, and deletion. Clerk sends event notifications to the webhook endpoint configured in the Clerk dashboard.

### Webhook Setup

1. In the Clerk Dashboard, navigate to Webhooks
2. Add an endpoint URL: `https://your-api-domain.com/clerk-webhook`
3. Select the events you want to receive (user.created, user.updated, etc.)
4. Copy the webhook signing secret for your environment variables

### Webhook Processing

The webhook handler:
1. Verifies the Clerk signature to ensure the request is legitimate
2. Processes user lifecycle events
3. Updates user data in the application database

```typescript
// packages/core/src/orchestrator/auth/adapters/primary/webhook.adapter.ts
export const webhookAdapter = async (event: APIGatewayProxyEventV2) => {
  // Extract Clerk signature from headers
  const signature = event.headers['clerk-signature'];
  
  // Verify webhook signature
  const payload = verifyClerkWebhookSignature(
    event.body,
    signature,
    webhookSecret
  );
  
  // Process the webhook event
  const result = await processWebhookUseCase(payload);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ received: true, result })
  };
};
```

**Webhook Processing Logic:**
```typescript
// packages/core/src/orchestrator/auth/usecases/process-webhook.usecase.ts
export async function processWebhookUseCase(event: any) {
  switch (event.type) {
    case 'user.created':
      return await handleUserCreated(event.data);
    case 'user.updated':
      return await handleUserUpdated(event.data);
    case 'user.deleted':
      return await handleUserDeleted(event.data);
    default:
      return { status: 'ignored', event: event.type };
  }
}
```

## Frontend Integration

The frontend uses the `@clerk/nextjs` package to handle authentication. The ClerkProvider wraps the application to provide authentication context.

### Root Layout Configuration

```tsx
// packages/frontend/src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
```

### User Profile Component

```tsx
// packages/frontend/src/components/UserProfile.tsx
import { UserButton, useUser } from "@clerk/nextjs";

export function UserProfile() {
  const { isLoaded, user } = useUser();
  
  if (!isLoaded || !user) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="user-profile">
      <h2>Welcome, {user.firstName}!</h2>
      <div className="user-button">
        <UserButton />
      </div>
    </div>
  );
}
```

### Sign-In and Sign-Up Pages

Clerk provides pre-built components for authentication pages:

```tsx
// packages/frontend/src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="auth-container">
      <SignIn />
    </div>
  );
}
```

```tsx
// packages/frontend/src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="auth-container">
      <SignUp />
    </div>
  );
}
```

## Backend Integration

The backend uses the `@clerk/backend` package to validate JWT tokens from Clerk. The `SaaSIdentityVendingMachine` class handles authentication and user validation.

### JWT Validation

```typescript
// packages/core/src/orchestrator/auth/adapters/secondary/clerk.adapter.ts
import { verifyToken } from '@clerk/backend';

export async function validateAuthToken(token: string) {
  try {
    const decoded = await verifyToken(token);
    return {
      isValid: true,
      userId: decoded.sub,
      claims: decoded
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}
```

### Protected API Endpoint

```typescript
// packages/functions/src/api/protected-resource.ts
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { validateAuthToken } from '../auth/clerk.adapter';

export const handler = async (event: APIGatewayProxyEventV2) => {
  // Extract authorization header
  const authHeader = event.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  
  // Validate token
  const validation = await validateAuthToken(token);
  
  if (!validation.isValid) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }
  
  // Process the authenticated request
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'Protected data',
      userId: validation.userId
    })
  };
};
```

## Troubleshooting

### Common Issues

1. **JWT validation failures**
   - Ensure the Clerk secret key is correctly configured
   - Check that the token is being properly passed in the Authorization header

2. **Middleware not protecting routes**
   - Verify the middleware configuration and matcher patterns
   - Check that public routes are correctly specified

3. **Webhook verification failures**
   - Ensure the webhook secret is correctly configured
   - Check that the endpoint is accessible by Clerk

### Testing Authentication

For testing:
1. Create test users in the Clerk Dashboard
2. Use the Clerk development instance for local testing
3. Test both authenticated and unauthenticated flows

### Logging and Monitoring

All authentication-related operations should be logged. To troubleshoot issues:
1. Check application logs for error messages
2. Verify events in the Clerk Dashboard
3. Test webhook deliveries using the Clerk CLI

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Webhooks](https://clerk.com/docs/webhooks/overview)
