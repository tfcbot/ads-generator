import { CheckoutSessionInput } from '@metadata/credits.schema';
import { createSession } from '../adapters/secondary/stripe.adapter';

export async function createCheckoutSessionUseCase(input: CheckoutSessionInput) {
  try {
    const session = await createSession(input);
    return session;
  } catch (error) {
    console.error('Error in checkout usecase:', error);
    throw error;
  }
}
