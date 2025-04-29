
export const openaiApiKey = new sst.Secret("OpenAiApiKey")
export const stripeSecretKey = new sst.Secret('StripeSecretKey')
export const stripeWebhookSecret = new sst.Secret('StripeWebhookSecret')
export const stripePublishableKey = new sst.Secret('StripePublishableKey')
export const unkeyApiId = new sst.Secret('UnkeyApiId')
export const unkeyRootKey = new sst.Secret('UnkeyRootKey')
export const clerkClientPublishableKey = new sst.Secret("ClerkClientPublishableKey")
export const clerkClientSecretKey = new sst.Secret("ClerkClientSecretKey")
export const clerkClientWebhookSecret = new sst.Secret("ClerkClientWebhookSecret")
export const resendApiKey = new sst.Secret("ResendApiKey")

export const secrets = [
    openaiApiKey,
    clerkClientPublishableKey,
    clerkClientSecretKey,
    clerkClientWebhookSecret,
    stripeSecretKey,
    stripeWebhookSecret,
    stripePublishableKey,
    unkeyApiId,
    unkeyRootKey,
    resendApiKey
]