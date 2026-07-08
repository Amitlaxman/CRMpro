"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryService = void 0;
class RetryService {
    static async executeWithRetry(fn, maxRetries = 3, delayMs = 500) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                return await fn();
            }
            catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw error;
                }
                const backoffDelay = delayMs * Math.pow(2, attempt - 1);
                console.warn(`[Retry Service] Attempt ${attempt} failed. Retrying in ${backoffDelay}ms...`, error);
                await new Promise((res) => setTimeout(res, backoffDelay));
            }
        }
        throw new Error("Max retries exceeded");
    }
}
exports.RetryService = RetryService;
