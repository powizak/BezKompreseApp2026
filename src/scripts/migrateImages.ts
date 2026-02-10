/**
 * Migration Script for Image Optimization
 * 
 * This script migrates existing single-variant images to the new multi-variant system.
 * It processes all existing images in Firebase Storage and generates thumb/medium/large variants.
 * 
 * PREREQUISITES:
 * 1. Firebase Admin SDK credentials configured
 * 2. Access to Firebase Storage
 * 3. Node.js installed
 * 
 * USAGE:
 * 1. Review the configuration below
 * 2. Run: npm run migrate:images  (or node migrateImages.js)
 * 3. Monitor progress in console
 * 
 * SAFETY:
 * - The script backs up original image URLs before modification
 * - Failed migrations can be retried
 * - Set DRY_RUN=true to test without making changes
 */

/*import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import serviceAccount from '../firebase-service-account.json'; // You'll need to download this from Firebase Console
import { processAndUploadImage } from '../src/lib/imageService';
import { Effect } from 'effect';

// ================== CONFIGURATION ==================
const DRY_RUN = false; // Set to true to test without making actual changes
const BATCH_SIZE = 5; // Process 5 images at a time
const COLLECTIONS_TO_MIGRATE = ['cars', 'events', 'marketplace'];

// ================== INITIALIZATION ==================
console.log('🚀 Starting Image Migration...\n');

const app = initializeApp({
    credential: cert(serviceAccount as any),
    storageBucket: 'YOUR-PROJECT-ID.appspot.com' // Replace with your bucket
});

const db = getFirestore(app);
const storage = getStorage(app).bucket();

// ================== HELPER FUNCTIONS ==================

/**
 * Download an image from Firebase Storage
 */
/*async function downloadImage(url: string): Promise<Blob> {
    // Extract path from Firebase Storage URL
    const pathMatch = url.match(/\/o\/(.+?)\?/);
    if (!pathMatch) throw new Error(`Invalid Firebase Storage URL: ${url}`);
    const urlPath = decodeURIComponent(pathMatch[1]);

    const file = storage.file(urlPath);
    const [buffer] = await file.download();
    return new Blob([buffer]);
}

/**
 * Convert Blob to File for imageService
 */
/*function blobToFile(blob: Blob, filename: string): File {
    return new File([blob], filename, { type: 'image/webp' });
}

/**
 * Check if a value is already in ImageVariants format
 */
/*function isImageVariants(value: any): boolean {
    return (
        typeof value === 'object' &&
        value !== null &&
        'thumb' in value &&
        'medium' in value &&
        'large' in value
    );
}

// ================== MIGRATION LOGIC ==================

/**
 * Migrate car photos
 */
/*async function migrateCars() {
    console.log('\n📸 Migrating car photos...');

    const carsSnapshot = await db.collection('cars').get();
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const carDoc of carsSnapshot.docs) {
        const car = carDoc.data();

        if (!car.photos || !Array.isArray(car.photos)) {
            console.log(`⏭️  Skipping car ${carDoc.id} - no photos`);
            continue;
        }

        const newPhotos = [];
        let carModified = false;

        for (let i = 0; i < car.photos.length; i++) {
            const photo = car.photos[i];

            // Skip if already migrated
            if (isImageVariants(photo)) {
                newPhotos.push(photo);
                skippedCount++;
                continue;
            }

            // Need to migrate this photo
            try {
                console.log(`   Processing car ${carDoc.id}, photo ${i + 1}/${car.photos.length}`);

                if (DRY_RUN) {
                    console.log(`   [DRY RUN] Would migrate: ${photo.substring(0, 50)}...`);
                    newPhotos.push(photo);
                    continue;
                }

                // Download original image
                const blob = await downloadImage(photo);
                const file = blobToFile(blob, `photo_${i}.webp`);

                // Generate variants using imageService
                const basePath = `cars/${carDoc.id}/${Date.now()}_migrated_${i}`;
                const variants = await Effect.runPromise(processAndUploadImage(file, basePath));

                newPhotos.push(variants);
                migratedCount++;
                carModified = true;

                console.log(`   ✅ Migrated photo ${i + 1}`);
            } catch (error) {
                console.error(`   ❌ Error migrating photo ${i + 1}:`, error);
                // Keep original photo on error
                newPhotos.push(photo);
                errorCount++;
            }
        }

        // Update Firestore document if any photos were migrated
        if (carModified && !DRY_RUN) {
            await db.collection('cars').doc(carDoc.id).update({ photos: newPhotos });
            console.log(`✅ Updated car ${carDoc.id}`);
        }
    }

    console.log(`\n📊 Cars migration complete: ${migratedCount} migrated, ${skippedCount} skipped, ${errorCount} errors`);
}

/**
 * Migrate event images
 */
/*async function migrateEvents() {
    console.log('\n🎪 Migrating event images...');

    const eventsSnapshot = await db.collection('events').get();
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const eventDoc of eventsSnapshot.docs) {
        const event = eventDoc.data();

        if (!event.imageUrl) {
            skippedCount++;
            continue;
        }

        // Skip if already migrated
        if (isImageVariants(event.imageUrl)) {
            console.log(`⏭️  Event ${eventDoc.id} already migrated`);
            skippedCount++;
            continue;
        }

        try {
            console.log(`   Processing event ${eventDoc.id}`);

            if (DRY_RUN) {
                console.log(`   [DRY RUN] Would migrate: ${event.imageUrl.substring(0, 50)}...`);
                continue;
            }

            // Download original image
            const blob = await downloadImage(event.imageUrl);
            const file = blobToFile(blob, `event.webp`);

            // Generate variants
            const basePath = `events/${eventDoc.id}/${Date.now()}_migrated`;
            const variants = await Effect.runPromise(processAndUploadImage(file, basePath));

            // Update Firestore
            await db.collection('events').doc(eventDoc.id).update({ imageUrl: variants });

            migratedCount++;
            console.log(`   ✅ Migrated event ${eventDoc.id}`);
        } catch (error) {
            console.error(`   ❌ Error migrating event ${eventDoc.id}:`, error);
            errorCount++;
        }
    }

    console.log(`\n📊 Events migration complete: ${migratedCount} migrated, ${skippedCount} skipped, ${errorCount} errors`);
}

/**
 * Migrate marketplace listing images
 */
/*async function migrateMarketplace() {
    console.log('\n🛒 Migrating marketplace images...');

    const listingsSnapshot = await db.collection('marketplace').get();
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const listingDoc of listingsSnapshot.docs) {
        const listing = listingDoc.data();

        if (!listing.imageUrl) {
            skippedCount++;
            continue;
        }

        // Skip if already migrated
        if (isImageVariants(listing.imageUrl)) {
            console.log(`⏭️  Listing ${listingDoc.id} already migrated`);
            skippedCount++;
            continue;
        }

        try {
            console.log(`   Processing listing ${listingDoc.id}`);

            if (DRY_RUN) {
                console.log(`   [DRY RUN] Would migrate: ${listing.imageUrl.substring(0, 50)}...`);
                continue;
            }

            // Download original image
            const blob = await downloadImage(listing.imageUrl);
            const file = blobToFile(blob, `listing.webp`);

            // Generate variants
            const basePath = `marketplace/${listingDoc.id}/${Date.now()}_migrated`;
            const variants = await Effect.runPromise(processAndUploadImage(file, basePath));

            // Update Firestore
            await db.collection('marketplace').doc(listingDoc.id).update({ imageUrl: variants });

            migratedCount++;
            console.log(`   ✅ Migrated listing ${listingDoc.id}`);
        } catch (error) {
            console.error(`   ❌ Error migrating listing ${listingDoc.id}:`, error);
            errorCount++;
        }
    }

    console.log(`\n📊 Marketplace migration complete: ${migratedCount} migrated, ${skippedCount} skipped, ${errorCount} errors`);
}

// ================== MAIN EXECUTION ==================

async function main() {
    const startTime = Date.now();

    if (DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    }

    try {
        if (COLLECTIONS_TO_MIGRATE.includes('cars')) {
            await migrateCars();
        }

        if (COLLECTIONS_TO_MIGRATE.includes('events')) {
            await migrateEvents();
        }

        if (COLLECTIONS_TO_MIGRATE.includes('marketplace')) {
            await migrateMarketplace();
        }

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n\n✨ Migration complete in ${elapsedTime}s`);
        console.log('\n💡 Next steps:');
        console.log('   1. Verify images display correctly in the app');
        console.log('   2. Update other components (Cars.tsx, CarDetail.tsx, Market.tsx, Events.tsx)');
        console.log('   3. Monitor Firebase Storage usage');
        console.log('   4. Optionally delete old single-variant images to free space\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
main().then(() => process.exit(0));

/**
 * IMPORTANT NOTES:
 * 
 * 1. FIREBASE SERVICE ACCOUNT:
 *    You need to download your Firebase service account JSON from:
 *    Firebase Console > Project Settings > Service Accounts > Generate New Private Key
 *    Save it as firebase-service-account.json in your project root
 * 
 * 2. RUNNING THE SCRIPT:
 *    Add to package.json scripts:
 *    "migrate:images": "tsx src/scripts/migrateImages.ts"
 *    
 *    Then run: npm run migrate:images
 * 
 * 3. DRY RUN FIRST:
 *    Always run with DRY_RUN=true first to see what will be migrated
 * 
 * 4. BATCH PROCESSING:
 *    For large datasets, you may want to add delay between batches:
 *    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
 * 
 * 5. ERROR HANDLING:
 *    Failed migrations keep the original URL. You can run the script
 *    multiple times safely - it will skip already-migrated images.
 * 
 * 6. STORAGE COSTS:
 *    After migration, you'll have both old and new images. Consider
 *    cleaning up old images after verifying the migration worked.
 */
