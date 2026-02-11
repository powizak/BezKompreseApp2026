class ImageLoaderService {
    private static instance: ImageLoaderService;
    private queue: Array<() => Promise<void>> = [];
    private activeCount = 0;
    private maxConcurrency = 3; // Reduced concurrency to be safer against 429s (Google LH3 is strict)
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
     * Pre-loads the image using standard Browser Image object.
     * Includes persistent "circuit breaker" via localStorage to prevent loops on reload.
     */
    public loadImage(url: string): Promise<void> {
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
            });
        });

        this.cache.set(url, promise);
        return promise;
    }

    private enqueue(task: () => Promise<void>) {
        this.queue.push(task);
        this.processQueue();
    }

    private async processQueue() {
        if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }

        this.activeCount++;
        const task = this.queue.shift();

        if (task) {
            try {
                await task();
            } finally {
                this.activeCount--;
                // Add small delay between tasks to avoid bursting
                setTimeout(() => this.processQueue(), 100);
            }
        }
    }

    private loadImageNative(url: string, attempt = 1): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            const cleanup = () => {
                img.onload = null;
                img.onerror = null;
            };

            img.onload = () => {
                cleanup();
                resolve();
            };

            img.onerror = async () => {
                cleanup();
                const maxRetries = 5;

                if (attempt < maxRetries) {
                    // Exponential backoff with jitter: 2s, 4s, 8s, 16s... + random
                    // Starting higher (2s) because 429s need patience.
                    const baseDelay = 2000 * Math.pow(2, attempt - 1);
                    const jitter = Math.random() * 1000;
                    const delay = baseDelay + jitter;

                    console.warn(`[ImageLoader] Retry ${attempt}/${maxRetries} for ${url} in ${Math.round(delay)}ms`);
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
