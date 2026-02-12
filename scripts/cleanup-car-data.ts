/**
 * Cleanup Script: Trim whitespace from Car data (Make, Model, Engine, Name)
 * 
 * This script iterates over all documents in the 'cars' collection and trims
 * whitespace from the following fields:
 * - make
 * - model
 * - engine
 * - name
 * 
 * USAGE:
 *   npx tsx scripts/cleanup-car-data.ts
 * 
 * DRY RUN:
 *   DRY_RUN=true npx tsx scripts/cleanup-car-data.ts
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ================== CONFIGURATION ==================
const DRY_RUN = process.env.DRY_RUN === 'true';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVICE_ACCOUNT_PATH = resolve(__dirname, '..', 'firebase-service-account.json');

// ================== INITIALIZATION ==================
let serviceAccount: ServiceAccount;
try {
    serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
} catch (e) {
    console.error('❌ Could not read firebase-service-account.json');
    console.error(`   Expected at: ${SERVICE_ACCOUNT_PATH}`);
    console.error(e);
    process.exit(1);
}

const app = initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore(app);

// ================== MAIN LOGIC ==================

async function cleanupCarData() {
    console.log('🔍 Scanning Cars collection for whitespace issues...\n');
    if (DRY_RUN) {
        console.log('⚠️  DRY RUN MODE — no changes will be made\n');
    }

    const carsSnapshot = await db.collection('cars').get();

    console.log(`📦 Found ${carsSnapshot.size} cars to check\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const fieldsToCheck = ['make', 'model', 'engine', 'name'];

    for (const doc of carsSnapshot.docs) {
        try {
            const data = doc.data();
            const updates: Record<string, string> = {};
            let hasChanges = false;

            for (const field of fieldsToCheck) {
                if (data[field] && typeof data[field] === 'string') {
                    const original = data[field];
                    const trimmed = original.trim();

                    if (original !== trimmed) {
                        updates[field] = trimmed;
                        hasChanges = true;

                        if (DRY_RUN) {
                            console.log(`  [DRY RUN] ${doc.id} (${data.name}): Field '${field}' would change: "${original}" -> "${trimmed}"`);
                        }
                    }
                }
            }

            if (!hasChanges) {
                skippedCount++;
                continue;
            }

            if (DRY_RUN) {
                updatedCount++;
                continue;
            }

            await doc.ref.update(updates);
            console.log(`  ✅ Updated ${doc.id} (${data.name || 'Unknown'}): ${Object.keys(updates).join(', ')}`);
            updatedCount++;

        } catch (error) {
            errorCount++;
            console.error(`  ❌ Error processing ${doc.id}: ${error}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Cleanup complete:`);
    console.log(`   ✅ Updated:  ${updatedCount}`);
    console.log(`   ⏭️  Skipped:  ${skippedCount} (clean)`);
    console.log(`   ❌ Errors:   ${errorCount}`);
    console.log('='.repeat(50));
}

// ================== RUN ==================
cleanupCarData()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
