import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { processWebhookUseCase } from '../../usecases/process-webhook.usecase';
import { Resource } from 'sst';
const Stripe = require('stripe');

export const webhookAdapter = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    if (!event.body) {
      throw new Error('Missing request body');
    }
    
    const signature = event.headers['stripe-signature'];
    if (!signature) {
      throw new Error('Missing stripe signature header');
    }
    
    const webhookSecret = Resource.StripeWebhookSecret.value;
    const stripeSecretKey = Resource.StripeSecretKey.value;
    const stripe = Stripe(stripeSecretKey);
    
    let stripeEvent;
    
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Webhook signature verification failed' })
      };
    }
    
    const result = await processWebhookUseCase(stripeEvent);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, result })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid request' })
    };
  }
};
