import {
  CheckoutSessionInput,
  TransactionType,
  UpdateUserCreditsCommand
} from '@metadata/credits.schema';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { Resource } from 'sst';
import { MetadataRefill } from '@metadata/credits.schema';
const client = new DynamoDBClient({});
const dynamoClient = DynamoDBDocumentClient.from(client);
const Stripe = require('stripe');

export async function createSession(params: CheckoutSessionInput) {
  console.log('Creating checkout session for user:', params.userId);
  const stripeSecretKey = Resource.StripeSecretKey.value;
  const stripe = Stripe(stripeSecretKey);
  const metadataRefill: MetadataRefill = {
    userId: params.userId,
    keyId: params.keyId,
    amount: "100",
  }

  const metadata = {
    ...metadataRefill
  }

  const appDomain = Resource.MyWeb.url?.includes('unavailable') ? 'http://localhost:3000' : Resource.MyWeb.url;

  const idempotencyKey = randomUUID();
  try {
    const creditsPerUnit = 100;

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
      metadata: metadata,
      customer_creation: 'always',
    },
    {
      idempotencyKey
    });

    return { id: session.id };
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}
