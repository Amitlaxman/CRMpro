"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
class CacheService {
    static set(key, value) {
        this.cache.set(key, value);
    }
    static get(key) {
        return this.cache.get(key);
    }
    static delete(key) {
        this.cache.delete(key);
    }
    // Response Caching helper operations
    static setResponse(hash, response) {
        this.responseCache.set(hash, response);
    }
    static getResponse(hash) {
        return this.responseCache.get(hash);
    }
    static cleanStale() {
        const now = Date.now();
        const STALE_TIME = 30 * 60 * 1000; // 30 minutes
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > STALE_TIME) {
                this.cache.delete(key);
            }
        }
    }
}
exports.CacheService = CacheService;
CacheService.cache = new Map();
// AI Response Cache mapping SHA-256 batch hashes -> AI extraction response
CacheService.responseCache = new Map();
