import { Effect } from "effect";
import { uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { storage } from "../config/firebase";
import { ImageProcessingError } from "./imageService";

/**
 * Downloads an image from an external URL and uploads it to Firebase Storage.
 * This is used to "internalize" Google/Facebook profile images to avoid 429 Rate Limits.
 * 
 * @param externalUrl The external image URL (e.g. lh3.googleusercontent.com...)
 * @param userId The user's UID for path construction
 * @returns Effect that resolves to the new Firebase Storage URL
 */
export const internalizeProfileImage = (
    externalUrl: string,
    userId: string
): Effect.Effect<string, ImageProcessingError> =>
    Effect.tryPromise({
        try: async () => {
            // 1. Fetch the image content
            const response = await fetch(externalUrl, {
                // Ensure we don't send restrictive headers that might cause CORS failure on some CDNs,
                // though Google usually allows simple GETs.
                // We need 'cors' mode to access the body.
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch external image: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();

            // 2. Upload to Firebase Storage
            // Path: users/{uid}/profile.webp
            // Using a fixed name so we overwrite instead of accumulating junk
            const storagePath = `users/${userId}/profile.webp`;

            const storageRef = ref(storage, storagePath);

            await uploadBytes(storageRef, blob, {
                contentType: blob.type || 'image/jpeg',
                cacheControl: 'public, max-age=31536000, immutable',
                customMetadata: {
                    originalUrl: externalUrl,
                    internalizedAt: new Date().toISOString()
                }
            });

            // 3. Get the public URL
            const downloadUrl = await getDownloadURL(storageRef);
            console.log(`[ProfileInternalizer] Successfully internalized image for ${userId}`);

            return downloadUrl;
        },
        catch: (error: unknown) => {
            console.warn('[ProfileInternalizer] Failed to internalize image:', error);
            return new ImageProcessingError("Failed to internalize profile image", error);
        }
    });
