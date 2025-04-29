import { randomUUID } from 'crypto';
import { 
    createLambdaAdapter, 
    EventParser,
    LambdaAdapterOptions,
    GetUserInfo
  } from '@lib/lambda-adapter.factory';
import { RequestAdInputSchema, RequestAdInput, AdStatus, PendingAdSchema, RequestAdOutput, PendingAd } from "@metadata/agents/ads-agent.schema";
import { OrchestratorHttpResponses } from '@metadata/http-responses.schema';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ValidUser } from '@metadata/saas-identity.schema';
import { apiKeyService } from '@utils/vendors/api-key-vendor';
import { UpdateUserCreditsCommand } from '@metadata/credits.schema';
import { runAdUsecase } from '../../usecase/ad.usecase';
import { adRepository } from '../secondary/datastore.adapter';

const adEventParser: EventParser<RequestAdInput> = (
  event: APIGatewayProxyEventV2,
  validUser: ValidUser
) => {
  if (!event.body) {
    throw new Error("Missing request body");
  }
  const parsedBody = JSON.parse(event.body);
  
  const parsedBodyWithIds = RequestAdInputSchema.parse({
    ...parsedBody,
    ...validUser,
  });

  return parsedBodyWithIds;   
};

const adAdapterOptions: LambdaAdapterOptions = {
  requireAuth: true,
  requireBody: true,
  requiredFields: ['prompt', 'targetAudience', 'brandInfo']
};

const decrementUserCredits = async (input: UpdateUserCreditsCommand) => {
  await apiKeyService.updateUserCredits({
    userId: input.userId,
    keyId: input.keyId,
    operation: 'decrement',
    amount: 1
  });
};

const createPendingAd = async (input: RequestAdInput) => {
  await decrementUserCredits({
      userId: input.userId,
      keyId: input.keyId,
      operation: 'decrement',
      amount: 1
  });

  const initialAd = PendingAdSchema.parse({
    adId: input.id,
    userId: input.userId,
    prompt: input.prompt,
    targetAudience: input.targetAudience,
    brandInfo: input.brandInfo,
    style: input.style,
    imageUrl: '',
    adStatus: AdStatus.PENDING,
  });
  console.info("Saving pending ad");
  await adRepository.saveAd(initialAd);
  console.info("Pending ad saved successfully");
  return initialAd;
};

const executeAdUsecase = async (input: RequestAdInput): Promise<PendingAd> => {
  const pendingAd = await createPendingAd(input);
  
  runAdUsecase(input).catch(error => {
    console.error('Error executing ad generation:', error);
  });

  return pendingAd;
}

export const requestAdAdapter = createLambdaAdapter({
  schema: RequestAdInputSchema,
  useCase: executeAdUsecase,
  eventParser: adEventParser,
  options: adAdapterOptions,
  responseFormatter: (result) => OrchestratorHttpResponses.PendingAdResponse({ body: {
    message: 'Ad retrieved successfully',
    data: result
  }})
});
