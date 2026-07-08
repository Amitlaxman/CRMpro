export interface CachedImport {
  filename: string
  filesize: number
  headers: string[]
  records: Record<string, string>[]
  batches: Record<string, string>[][]
  timestamp: number
}

export class CacheService {
  private static cache = new Map<string, CachedImport>()
  
  // AI Response Cache mapping SHA-256 batch hashes -> AI extraction response
  private static responseCache = new Map<string, any>()

  public static set(key: string, value: CachedImport): void {
    this.cache.set(key, value)
  }

  public static get(key: string): CachedImport | undefined {
    return this.cache.get(key)
  }

  public static delete(key: string): void {
    this.cache.delete(key)
  }

  // Response Caching helper operations
  public static setResponse(hash: string, response: any): void {
    this.responseCache.set(hash, response)
  }

  public static getResponse(hash: string): any | undefined {
    return this.responseCache.get(hash)
  }

  public static cleanStale(): void {
    const now = Date.now()
    const STALE_TIME = 30 * 60 * 1000 // 30 minutes
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > STALE_TIME) {
        this.cache.delete(key)
      }
    }
  }
}
