class ImageLoaderService {
    private static instance: ImageLoaderService;
    private highPriorityQueue: Array<() => Promise<void>> = [];
    private normalQueue: Array<() => Promise<void>> = [];
    private lowPriorityQueue: Array<() => Promise<void>> = [];
    private activeCount = 0;
    private maxConcurrency = 3; // Reverted to 3 to prevent 429 errors (Google is strict)
    private cache = new Map<string, Promise<void>>();
    private readonly FAILURE_CACHE_KEY = 'img_load_failures';
    private readonly FAILURE_TTL = 5 * 60 * 1000; // 5 minutes

    private constructor() {
        this.cleanupFailureCache();
    }

    public static getInstance(): ImageLoaderService {
        if (!ImageLoaderService.instance) {
            ImageLoaderService.instance = new ImageLoaderService();
        }
        return ImageLoaderService.instance;
    }

    /**
     * Clears the failure cache (circuit breaker).
     */
    public resetFailureCache() {
        try {
            localStorage.removeItem(this.FAILURE_CACHE_KEY);
            this.cache.clear();
        } catch (e) {
            console.warn("[ImageLoader] Failed to reset cache:", e);
        }
    }

    /**
     * Pre-loads the image using standard Browser Image object.
     * Includes persistent "circuit breaker" via localStorage to prevent loops on reload.
     * @param url The image URL to load
     * @param priority If true/'high', image is placed at the front. 'low' places it at the back. Default/false is normal.
     */
    public loadImage(url: string, priority: boolean | 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
        if (this.cache.has(url)) {
            return this.cache.get(url)!;
        }

        // Circuit breaker: Check if this URL failed recently (persisted across reloads)
        if (this.isUrlBlocked(url)) {
            const blockedPromise = Promise.reject(new Error(`Image blocked by circuit breaker: ${url}`));
            this.cache.set(url, blockedPromise);
            return blockedPromise;
        }

        const promise = new Promise<void>((resolve, reject) => {
            this.enqueue(async () => {
                try {
                    await this.loadImageNative(url);
                    resolve();
                } catch (error) {
                    this.markUrlAsFailed(url);
                    reject(error);
                    // Keep the rejected promise in cache to prevent immediate retries in this session
                }
            }, priority);
        });

        this.cache.set(url, promise);
        return promise;
    }

    private enqueue(task: () => Promise<void>, priority: boolean | 'high' | 'normal' | 'low') {
        if (priority === true || priority === 'high') {
            this.highPriorityQueue.push(task);
        } else if (priority === 'low') {
            this.lowPriorityQueue.push(task);
        } else {
            this.normalQueue.push(task);
        }
        this.processQueue();
    }

    private async processQueue() {
        if (this.activeCount >= this.maxConcurrency) {
            return;
        }

        // Try high priority first, then normal, then low
        const task = this.highPriorityQueue.shift() || this.normalQueue.shift() || this.lowPriorityQueue.shift();

        if (!task) {
            return;
        }

        this.activeCount++;
        try {
            await task();
        } finally {
            this.activeCount--;
            // Reduced delay to process queue faster
            setTimeout(() => this.processQueue(), 50);
        }
    }

    private loadImageNative(url: string, attempt = 1): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            let timer: any = null;

            const cleanup = () => {
                img.onload = null;
                img.onerror = null;
                if (timer) clearTimeout(timer);
            };

            img.onload = () => {
                cleanup();
                resolve();
            };

            img.onerror = async () => {
                cleanup();
                const maxRetries = 3; // Reduced from 5 to 3 for faster feedback

                if (attempt < maxRetries) {
                    // Backoff: 1s, 2s, 4s
                    const baseDelay = 1000 * Math.pow(2, attempt - 1);
                    const jitter = Math.random() * 500;
                    const delay = baseDelay + jitter;

                    // Only warn on later retries to reduce noise
                    if (attempt > 1) {
                        console.warn(`[ImageLoader] Retry ${attempt}/${maxRetries} for ${url}`);
                    }

                    await new Promise(r => setTimeout(r, delay));

                    try {
                        await this.loadImageNative(url, attempt + 1);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    console.warn(`[ImageLoader] Failed to load ${url} after ${attempt} attempts - blocking URL`);
                    reject(new Error(`Failed to load image: ${url}`));
                }
            };

            // Hard timeout to prevent hanging forever on mobile
            timer = setTimeout(() => {
                cleanup();
                // We resolve even on timeout? No, we reject, but maybe with a special error?
                // Rejection is safer, let the UI fallback.
                reject(new Error(`Image load timed out: ${url}`));
            }, 15000); // 15 seconds max per image

            img.src = url;
        });
    }

    // --- Persistence / Circuit Breaker Logic ---

    private getFailedMap(): Record<string, number> {
        try {
            const data = localStorage.getItem(this.FAILURE_CACHE_KEY);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    }

    private isUrlBlocked(url: string): boolean {
        const failures = this.getFailedMap();
        const timestamp = failures[url];
        if (!timestamp) return false;

        if (Date.now() - timestamp < this.FAILURE_TTL) {
            return true; // Still blocked
        }
        return false; // Expired
    }

    private markUrlAsFailed(url: string) {
        const failures = this.getFailedMap();
        failures[url] = Date.now();
        localStorage.setItem(this.FAILURE_CACHE_KEY, JSON.stringify(failures));
    }

    private cleanupFailureCache() {
        const failures = this.getFailedMap();
        let changed = false;
        const now = Date.now();

        Object.keys(failures).forEach(url => {
            if (now - failures[url] > this.FAILURE_TTL) {
                delete failures[url];
                changed = true;
            }
        });

        if (changed) {
            localStorage.setItem(this.FAILURE_CACHE_KEY, JSON.stringify(failures));
        }
    }
}

export const ImageLoader = ImageLoaderService.getInstance();
