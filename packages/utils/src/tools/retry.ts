import { ZodError } from 'zod';

type RetryConfig = {
    retries: number;
    delay: number;
    onRetry: (error: Error) => void;
}

export function withRetry<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    config: RetryConfig
) {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        for (let attempt = 1; attempt <= config.retries; attempt++) {
            try {
                return await fn(...args);
            } catch (error) {
                if (error instanceof ZodError || error instanceof SyntaxError) {
                    console.warn(`Attempt ${attempt} failed due to ${error instanceof ZodError ? 'parsing' : 'JSON parsing'} error. Retrying...`);
                    if (attempt < config.retries) {
                        await new Promise(resolve => setTimeout(resolve, config.delay));
                    } else {
                        console.error('Max retries reached. Unable to generate valid output.');
                        throw error;
                    }
                } else {
                    console.error('Unexpected error:', error);
                    throw error;
                }
            }
        }
        throw new Error('Max retries reached. Unable to generate valid output.');
    };
}
