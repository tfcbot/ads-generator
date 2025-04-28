import { OrchestratorHttpResponses } from '@metadata/http-responses.schema';
import { 
  createLambdaAdapter, 
  EventParser,
  LambdaAdapterOptions 
} from '@lib/lambda-adapter.factory';
import { GetAdInput, GetAdInputSchema, RequestAdOutput } from '@metadata/agents/ads-agent.schema';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ValidUser } from '@metadata/saas-identity.schema';
import { getAdUsecase } from '../../usecase/get-ad.usecase';

const getAdByIdEventParser: EventParser<GetAdInput> = (
  event: APIGatewayProxyEventV2,
  validUser: ValidUser
) => {
  if (!event.pathParameters?.id) {
    throw new Error('Ad ID is required');
  }

  return {
    userId: validUser.userId,
    adId: event.pathParameters.id
  };
};

const adByIdAdapterOptions: LambdaAdapterOptions = {
  requireAuth: true,
  requireBody: false // GET requests don't have a body
};

export const getAdByIdAdapter = createLambdaAdapter({
  schema: GetAdInputSchema,
  useCase: getAdUsecase,
  eventParser: getAdByIdEventParser,
  options: adByIdAdapterOptions,
  responseFormatter: (result) => OrchestratorHttpResponses.GetAdResponse({body: {
    message: 'Ad retrieved successfully',
    data: result
  }})
});
