import { CheckoutSessionCompleted } from '@metadata/credits.schema';
import { apiKeyAdapter } from '@orchestrator/billing/adapters/secondary/api-key.adapter';

export async function processWebhookUseCase(event: any) {
  console.log('Processing webhook event:', event.type);
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutSessionCompleted(event.data.object);
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return { status: 'ignored', event: event.type };
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw error;
  }
}

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
