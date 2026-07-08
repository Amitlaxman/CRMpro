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
      } catch (error) {
        attempt++
        if (attempt >= maxRetries) {
          throw error
        }
        const backoffDelay = delayMs * Math.pow(2, attempt - 1)
        console.warn(`[Retry Service] Attempt ${attempt} failed. Retrying in ${backoffDelay}ms...`, error)
        await new Promise((res) => setTimeout(res, backoffDelay))
      }
    }
    throw new Error("Max retries exceeded")
  }
}
