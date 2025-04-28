import {Handler, SQSHandler, DynamoDBStreamHandler, DynamoDBBatchResponse } from 'aws-lambda'

export const createHandler = (handlerFn: (event: any) => Promise<any>): Handler => {
    return async (event) => {
      const response = await handlerFn(event);
      return response;
    };
};

export const createSQSHandler = (handlerFn: (event: any) => Promise<any>): SQSHandler => {
  return async (event) => {
    const response = await handlerFn(event);
    return response;
  };
};

export const createDynamoDBStreamHandler = (
  handlerFn: (
    event: any,
    context: any,
    callback: any
  ) => void | Promise<void | DynamoDBBatchResponse>
): DynamoDBStreamHandler => {
  return async (event, context, callback) => {
    const response = await handlerFn(event, context, callback);
    return response;
  };
};
