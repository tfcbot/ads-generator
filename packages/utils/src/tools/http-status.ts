import { z } from 'zod';

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  INSUFFICIENT_CREDITS = 429,
}

export const HttpResponseBodySchema = z.object({
  message: z.string(),
  data: z.any().optional(),
});

export const HttpResponseSchema = z.object({
  statusCode: z.number().int().positive(),
  headers: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  body: z.string(),
  isBase64Encoded: z.boolean().optional(),
});

export type HttpResponseBody = z.infer<typeof HttpResponseBodySchema>;
export type HttpResponse = z.infer<typeof HttpResponseSchema>;

export type HttpResponseParams<T> = {
  body: T;
  headers?: { [header: string]: string | number | boolean };
};

export const createHttpResponse = <T>(
  statusCode: HttpStatusCode,
  params: HttpResponseParams<T>
): HttpResponse => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...params.headers,
    },
    body: JSON.stringify(params.body),
    isBase64Encoded: false,
  };
};

export const HttpResponses = {
  OK: (params: HttpResponseParams<HttpResponseBody>) => 
    createHttpResponse(HttpStatusCode.OK, params),
  CREATED: (params: HttpResponseParams<HttpResponseBody>) => 
    createHttpResponse(HttpStatusCode.CREATED, params),
  ACCEPTED: (params: HttpResponseParams<any>) => 
    createHttpResponse(HttpStatusCode.ACCEPTED, params),
  BAD_REQUEST: (params: HttpResponseParams<HttpResponseBody>) => 
    createHttpResponse(HttpStatusCode.BAD_REQUEST, params),
  UNAUTHORIZED: (params: HttpResponseParams<HttpResponseBody>) => 
    createHttpResponse(HttpStatusCode.UNAUTHORIZED, params),
  FORBIDDEN: (params: HttpResponseParams<HttpResponseBody>) => 
    createHttpResponse(HttpStatusCode.FORBIDDEN, params),
  NOT_FOUND: (params: HttpResponseParams<HttpResponseBody>) => 
    createHttpResponse(HttpStatusCode.NOT_FOUND, params),
  INTERNAL_SERVER_ERROR: (params: HttpResponseParams<HttpResponseBody>) => 
    createHttpResponse(HttpStatusCode.INTERNAL_SERVER_ERROR, params)
  
};
