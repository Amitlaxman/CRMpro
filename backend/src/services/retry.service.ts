export class RetryService {
  public static async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 500
  ): Promise<T> {
    let attempt = 0
    while (attempt < maxRetries) {
      try {
        return await fn()
      } catch (error: any) {
        attempt++
        if (attempt >= maxRetries) {
          throw error
        }
        
        // Detect 429 rate limit errors (Gemini or OpenAI)
        const errStr = String(error?.message || "").toLowerCase()
        const isRateLimit = errStr.includes("429") || errStr.includes("rate limit") || errStr.includes("quota exceeded")
        
        const backoffDelay = isRateLimit
          ? 10000 * attempt // 10s, 20s, etc. rate limit cooldown
          : delayMs * Math.pow(2, attempt - 1)

        console.warn(`[Retry Service] Attempt ${attempt} failed. Retrying in ${backoffDelay}ms... ${isRateLimit ? "(Rate Limit Cooldown Active)" : ""}`, error)
        await new Promise((res) => setTimeout(res, backoffDelay))
      }
    }
    throw new Error("Max retries exceeded")
  }
}
