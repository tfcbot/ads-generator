import { OrchestratorHttpResponses } from '@metadata/http-responses.schema';
import { 
  createLambdaAdapter, 
  EventParser,
  LambdaAdapterOptions 
} from '@lib/lambda-adapter.factory';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ValidUser } from '@metadata/saas-identity.schema';
import { getUserAdsUsecase } from '../../usecase/get-all-ads.usecase';
import { GetAllUserAdsInput, GetAllUserAdsInputSchema } from '@metadata/agents/ads-generator.schema';

const getAllAdsEventParser: EventParser<GetAllUserAdsInput> = (
  event: APIGatewayProxyEventV2,
  validUser: ValidUser
) => {
  return {
    userId: validUser.userId
  };
};

const getAllUserAdsAdapterOptions: LambdaAdapterOptions = {
  requireAuth: true,
  requireBody: false // GET requests don't have a body
};

export const getAllUserAdsAdapter = createLambdaAdapter({
  schema: GetAllUserAdsInputSchema,
  useCase: getUserAdsUsecase,
  eventParser: getAllAdsEventParser,
  options: getAllUserAdsAdapterOptions,
  responseFormatter: (result) => OrchestratorHttpResponses.OK({ body: result })
});
