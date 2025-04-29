import {z} from 'zod';
import { HttpResponseParams, HttpStatusCode, createHttpResponse, HttpResponses } from "@utils/tools/http-status";
import { RequestAdOutput } from '@metadata/api-response.schema';
import { PendingAdSchema, RequestAdOutputSchema } from './agents/ads-agent.schema';



export const RequestAdResponseBodySchema = z.object({
    message: z.string(),
    data: RequestAdOutputSchema
});

export const PendingAdResponseBodySchema = z.object({
    message: z.string(),
    data: PendingAdSchema
});

export type RequestAdResponseBody = z.infer<typeof RequestAdResponseBodySchema>;
export type PendingAdResponseBody = z.infer<typeof PendingAdResponseBodySchema>;
export const OrchestratorHttpResponses = {
    ...HttpResponses,
    GetAdResponse: (params: HttpResponseParams<RequestAdResponseBody>) => createHttpResponse(HttpStatusCode.OK, params),
    PendingAdResponse: (params: HttpResponseParams<PendingAdResponseBody>) => createHttpResponse(HttpStatusCode.CREATED, params)
};  
  