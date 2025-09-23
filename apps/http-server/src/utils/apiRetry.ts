interface RetryOptions {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
}

export async function retryApiCall<T>(
    apiCall: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`🔄 API call attempt ${attempt}/${maxAttempts}`);
            const result = await apiCall();

            if (attempt > 1) {
                console.log(`✅ API call succeeded on attempt ${attempt}`);
            }

            return result;
        } catch (error) {
            lastError = error as Error;
            console.warn(`⚠️  API call attempt ${attempt} failed:`, lastError.message);

            // Don't retry on the last attempt
            if (attempt === maxAttempts) {
                break;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
            console.log(`⏳ Retrying in ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}

export function isRetriableError(error: any): boolean {
    if (!error) return false;

    const message = error.message || '';
    const status = error.status || error.statusCode || 0;

    // Retry on network errors
    if (message.includes('ECONNRESET') ||
        message.includes('ENOTFOUND') ||
        message.includes('ETIMEDOUT') ||
        message.includes('No content received')) {
        return true;
    }

    // Retry on 5xx server errors or rate limiting
    if (status >= 500 || status === 429) {
        return true;
    }

    return false;
} 