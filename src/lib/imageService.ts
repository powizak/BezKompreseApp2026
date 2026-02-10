import { Effect } from "effect";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

/**
 * Image variants for different display contexts
 */
export interface ImageVariants {
    thumb: string;   // 400x400px - list/grid views
    medium: string;  // 1000x1000px - detail views
    large: string;   // 1920x1920px - full-screen/high-res
}

/**
 * Image processing error
 */
export class ImageProcessingError {
    readonly _tag = "ImageProcessingError";
    readonly message: string;
    readonly cause?: unknown;
    constructor(message: string, cause?: unknown) {
        this.message = message;
        this.cause = cause;
    }
}

/**
 * Variant configuration for image processing
 */
interface VariantConfig {
    name: keyof ImageVariants;
    maxSize: number;
}

const VARIANT_CONFIGS: VariantConfig[] = [
    { name: "thumb", maxSize: 400 },
    { name: "medium", maxSize: 1000 },
    { name: "large", maxSize: 1920 },
];

const WEBP_QUALITY = 0.7;

/**
 * Resize and convert an image to WebP format
 */
const processImageVariant = (
    file: File,
    maxSize: number
): Effect.Effect<Blob, ImageProcessingError> =>
    Effect.async<Blob, ImageProcessingError>((resume) => {
        const reader = new FileReader();

        reader.onerror = () =>
            resume(
                Effect.fail(
                    new ImageProcessingError("Failed to read file", reader.error)
                )
            );

        reader.onload = (event) => {
            const result = event.target?.result;

            if (!result || typeof result !== 'string') {
                console.error('[imageService] FileReader result is invalid:', result);
                resume(
                    Effect.fail(
                        new ImageProcessingError("FileReader failed to read image data")
                    )
                );
                return;
            }

            const img = new Image();

            img.onerror = (error) => {
                console.error('[imageService] Image load error:', error, 'src length:', result.substring(0, 100));
                resume(
                    Effect.fail(
                        new ImageProcessingError("Failed to load image")
                    )
                );
            };

            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    let { width, height } = img;

                    // Calculate new dimensions maintaining aspect ratio
                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        resume(
                            Effect.fail(
                                new ImageProcessingError("Failed to get canvas context")
                            )
                        );
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                console.error('[imageService] Failed to create blob from canvas');
                                resume(
                                    Effect.fail(
                                        new ImageProcessingError("Failed to create blob")
                                    )
                                );
                                return;
                            }
                            resume(Effect.succeed(blob));
                        },
                        "image/webp",
                        WEBP_QUALITY
                    );
                } catch (error) {
                    console.error('[imageService] Image processing exception:', error);
                    resume(
                        Effect.fail(
                            new ImageProcessingError("Image processing failed", error)
                        )
                    );
                }
            };
            img.src = result;
        };

        reader.readAsDataURL(file);
    });

/**
 * Upload a blob to Firebase Storage
 */
const uploadBlob = (
    blob: Blob,
    path: string
): Effect.Effect<string, ImageProcessingError> =>
    Effect.tryPromise({
        try: async () => {
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        },
        catch: (error) => {
            console.error('[imageService] Upload failed:', error);
            return new ImageProcessingError("Failed to upload image", error);
        },
    });

/**
 * Process a single variant: resize and upload
 */
const processAndUploadVariant = (
    file: File,
    basePath: string,
    config: VariantConfig
): Effect.Effect<{ name: keyof ImageVariants; url: string }, ImageProcessingError> =>
    Effect.gen(function* (_) {
        const blob = yield* _(processImageVariant(file, config.maxSize));
        const variantPath = `${basePath}/${config.name}.webp`;
        const url = yield* _(uploadBlob(blob, variantPath));
        return { name: config.name, url };
    });

/**
 * Main function: Process image and upload all variants
 * 
 * @param file - The image file to process
 * @param basePath - Base storage path (e.g., "cars/car123/1234567890")
 * @returns Effect with ImageVariants containing URLs for all variants
 * 
 * @example
 * const result = await Effect.runPromise(
 *   processAndUploadImage(file, `cars/${carId}/${Date.now()}`)
 * );
 * // result = { thumb: "https://...", medium: "https://...", large: "https://..." }
 */
export const processAndUploadImage = (
    file: File,
    basePath: string
): Effect.Effect<ImageVariants, ImageProcessingError> =>
    Effect.gen(function* (_) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
            yield* _(
                Effect.fail(
                    new ImageProcessingError("Invalid file type. Only images are allowed.")
                )
            );
        }

        // Process all variants in parallel
        const results = yield* _(
            Effect.all(
                VARIANT_CONFIGS.map((config) =>
                    processAndUploadVariant(file, basePath, config)
                ),
                { concurrency: 3 }
            )
        );

        // Convert array of results to ImageVariants object
        const variants: ImageVariants = {
            thumb: "",
            medium: "",
            large: "",
        };

        for (const result of results) {
            variants[result.name] = result.url;
        }

        return variants;
    });

/**
 * Select the most appropriate variant based on display width
 * 
 * @param variants - ImageVariants object with all variant URLs
 * @param displayWidth - Expected display width in pixels
 * @returns URL of the most appropriate variant
 * 
 * @example
 * // For a 300px wide thumbnail
 * const url = selectVariant(imageVariants, 300); // Returns thumb URL
 * 
 * // For a 800px wide carousel
 * const url = selectVariant(imageVariants, 800); // Returns medium URL
 */
export const selectVariant = (
    variants: ImageVariants,
    displayWidth: number
): string => {
    //Account for 2x pixel density
    const effectiveWidth = displayWidth * 2;

    if (effectiveWidth <= 400) {
        return variants.thumb;
    } else if (effectiveWidth <= 1000) {
        return variants.medium;
    } else {
        return variants.large;
    }
};

/**
 * Helper to check if a value is ImageVariants (vs legacy string)
 */
export const isImageVariants = (value: unknown): value is ImageVariants => {
    return (
        typeof value === "object" &&
        value !== null &&
        "thumb" in value &&
        "medium" in value &&
        "large" in value
    );
};

/**
 * Helper to get URL from string or ImageVariants (backward compatible)
 */
export const getImageUrl = (
    photo: string | ImageVariants,
    variant: keyof ImageVariants = "thumb"
): string => {
    if (isImageVariants(photo)) {
        return photo[variant];
    }
    return photo; // Legacy string URL
};
