# Environment Variables Guide

This guide explains how to obtain the necessary environment variables for the project. Follow these steps to set up your `.env` file based on the `.env.template`.

## Table of Contents

1. [Clerk Authentication](#clerk-authentication)
2. [Stripe Payments](#stripe-payments)
3. [Unkey API Keys](#unkey-api-keys)
4. [OpenAI](#openai)
5. [Resend Email](#resend-email)
6. [Managing Secrets with SST](#managing-secrets-with-sst)

## Clerk Authentication

To obtain Clerk authentication variables:
1. Create an account at [Clerk](https://clerk.dev/)
2. Create a new application in the Clerk dashboard
3. Navigate to API Keys in your application settings
4. Copy the following keys:
   - `CLERK_PUBLISHABLE_KEY`: Your publishable key (starts with `pk_`)
   - `CLERK_SECRET_KEY`: Your secret key (starts with `sk_`)
   - `CLERK_WEBHOOK_SECRET`: Create a webhook in the Clerk dashboard and copy the signing secret

## Stripe Payments

For Stripe payment integration:
1. Sign up for a [Stripe account](https://stripe.com/)
2. Go to the Developers section in your Stripe dashboard
3. Navigate to API keys
4. Copy the following:
   - `STRIPE_SECRET_KEY`: Your secret key (starts with `sk_`)
   - `STRIPE_WEBHOOK_SECRET`: Create a webhook endpoint in the Stripe dashboard and copy the signing secret
   - `STRIPE_PUBLISHABLE_KEY`: Your publishable key (starts with `pk_`)

## Unkey API Keys

For Unkey API key management:
1. Create an account at [Unkey](https://unkey.dev/)
2. Create a new project
3. Navigate to API Keys in your project settings
4. Copy the following:
   - `UNKEY_API_ID`: Your API ID
   - `UNKEY_ROOT_KEY`: Your root key for API operations

## OpenAI

To get OpenAI API access:
1. Create an account at [OpenAI](https://platform.openai.com/)
2. Navigate to API Keys in your account settings
3. Create a new API key
4. Copy the key for `OPENAI_API_KEY`

## Resend Email

To set up Resend for email services:
1. Create an account at [Resend](https://resend.com/)
2. Navigate to API Keys in your dashboard
3. Create a new API key
4. Copy the key for `RESEND_API_KEY` (starts with `re_`)
5. Add this key to your environment variables or SST secrets

## Managing Secrets with SST

Instead of storing sensitive information in `.env` files, you can use SST's Secret component for secure secret management:

1. **Create a Secret in your SST config**:
   ```typescript
   // sst.config.ts
   const openApiSecret = new sst.Secret("OpenAiApiKey");
   const resendSecret = new sst.Secret("ResendApiKey");
   ```

2. **Set Secret Values via CLI**:
   ```bash
   # Set a secret value for current stage
   sst secret set OpenAiApiKey sk_your_openai_key_here
   
   # Set a fallback value (useful for PR environments)
   sst secret set ResendApiKey re_your_resend_key_here --fallback
   ```

3. **Link Secrets to Your Resources**:
   ```typescript
   // sst.config.ts
   new sst.aws.Nextjs("Web", {
     link: [openApiSecret, resendSecret]
   });
   ```

4. **Access Secrets in Your Code**:
   ```typescript
   import { Resource } from "sst";
   
   // Access the secret value
   const openAiKey = Resource.OpenAiApiKey.value;
   const resendKey = Resource.ResendApiKey.value;
   ```

5. **Advantages of SST Secrets**:
   - Encrypted and stored in an S3 bucket in your AWS account
   - Encrypted in your state file when used in app config
   - Encrypted when included in function bundles
   - Decrypted synchronously when your function starts
   - No need to commit sensitive values to version control
   - Different values per environment/stage

Remember to deploy your application with `sst deploy` after setting secrets if you're not running `sst dev`.



