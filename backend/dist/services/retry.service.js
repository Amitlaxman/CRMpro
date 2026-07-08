"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryService = void 0;
class RetryService {
    static async executeWithRetry(fn, maxRetries = 3, delayMs = 500) {
        let attempt = 0;
        let currentMaxRetries = maxRetries;
        while (attempt < currentMaxRetries) {
            try {
                return await fn();
            }
            catch (error) {
                attempt++;
                // Detect 429 rate limit errors (Gemini or OpenAI)
                const errStr = String(error?.message || "").toLowerCase();
                const isRateLimit = errStr.includes("429") || errStr.includes("rate limit") || errStr.includes("quota exceeded");
                if (isRateLimit) {
                    currentMaxRetries = Math.max(currentMaxRetries, 5); // Increase retry attempts for rate limits
                }
                if (attempt >= currentMaxRetries) {
                    throw error;
                }
                let backoffDelay = delayMs * Math.pow(2, attempt - 1);
                if (isRateLimit) {
                    // Parse retry time if provided in the error message (e.g. Please retry in 21.85s or try again in 2.7s)
                    let retrySeconds = 0;
                    const match = errStr.match(/(?:retry in|try again in) (\d+(?:\.\d+)?)\s*s/i);
                    if (match && match[1]) {
                        retrySeconds = parseFloat(match[1]);
                    }
                    if (retrySeconds > 0) {
                        backoffDelay = Math.ceil((retrySeconds + 1.5) * 1000);
                    }
                    else {
                        backoffDelay = 10000 * attempt; // fallback rate limit cooldown
                    }
                }
                console.warn(`[Retry Service] Attempt ${attempt}/${currentMaxRetries} failed. Retrying in ${backoffDelay}ms... ${isRateLimit ? "(Rate Limit Cooldown Active)" : ""}`, error);
                await new Promise((res) => setTimeout(res, backoffDelay));
            }
        }
        throw new Error("Max retries exceeded");
    }
}
exports.RetryService = RetryService;
