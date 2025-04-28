import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { SaaSIdentityVendingMachine } from '@utils/tools/saas-identity';
import { processWebhookUseCase } from '../../usecases/process-webhook.usecase';
import { MessageSchema } from '@metadata/saas-identity.schema';
import { ClerkService } from '@utils/vendors/jwt-vendor';

export const authWebhookAdapter = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.info("Auth webhook adapter received event:", event.headers['svix-id']);
  
  try {
    if (!event.body) {
      throw new Error('Missing request body');
    }
    
    let webhookEvent;
    
    try {
      // Validate the webhook event with Clerk
      const clerkService = new ClerkService();
      webhookEvent = await clerkService.validateWebhookEvent(event);
      console.info("Validated webhook event of type:", webhookEvent.type);
    } catch (err) {
      console.error('Webhook validation failed:', err);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Invalid webhook payload' 
        })
      };
    }
    
    // Process the webhook event with our usecase
    const result = await processWebhookUseCase(webhookEvent);
    
    // Parse using the MessageSchema and return success
    const response = MessageSchema.parse({ 
      message: 'Webhook processed successfully' 
    });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...response,
        result
      })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 