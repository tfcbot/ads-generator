import { HttpStatusCode, HttpResponses, HttpResponse } from './http-status';
import { ZodError } from 'zod';


export class AppError extends Error {
  constructor(
    public statusCode: HttpStatusCode,
    public message: string,
    public isOperational = true,
    public stack = ''
  ) {
    super(message);
    this.name = this.constructor.name;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export const createError = (statusCode: HttpStatusCode, message: string): AppError => {
  return new AppError(statusCode, message);
};

export const handleError = (error: unknown): HttpResponse => {
  console.error('Error:', error);
  if (error instanceof Error) {
    console.error('Error stack:', error.stack);
  }

  if (error instanceof AppError) {
    return HttpResponses.BAD_REQUEST({ body: { message: 'AppError' } });
  }

  if (error instanceof ZodError) {
    return HttpResponses.BAD_REQUEST({ body: { message: 'Zod validation error' } });
  }

  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return HttpResponses.BAD_REQUEST({ body: { message: 'Invalid JSON in request body' } });
  }

  return HttpResponses.INTERNAL_SERVER_ERROR({ body: { message: 'Internal Server Error' } });
};