import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'; 
import { createCheckoutSessionUseCase } from '../../usecases/checkout.usecase';
import { 
  CheckoutSessionInput, 
  CheckoutSessionInputSchema 
} from '@metadata/credits.schema';
import { SaaSIdentityVendingMachine } from '@utils/tools/saas-identity';

export const checkoutAdapter = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
;
    const svm = new SaaSIdentityVendingMachine();
    const validUser = await svm.getValidUser(event);
    
    const params: CheckoutSessionInput = CheckoutSessionInputSchema.parse({ 
      userId: validUser.userId,
      keyId: validUser.keyId
    });
    
    const session = await createCheckoutSessionUseCase(params);  

    return {
      statusCode: 200,
      body: JSON.stringify(session),
    };
  } catch (error) {
    console.error('Error processing checkout:', error);
    return {
      statusCode: error instanceof Error ? (error.message === 'Unauthorized' ? 401 : 400) : 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid request' }),
    };
  }
};
