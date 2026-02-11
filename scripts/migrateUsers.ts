
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import admin from 'firebase-admin';
import fs from 'fs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = resolve(__dirname, '../firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account file not found!');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function migrateUsers() {
    console.log('🚀 Starting user migration...');

    try {
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;
        console.log(`Found ${totalUsers} users to migrate.`);

        let processed = 0;
        const batchSize = 500;
        const chunks = [];

        // Split into chunks for batch processing
        const docs = usersSnapshot.docs;
        for (let i = 0; i < docs.length; i += batchSize) {
            chunks.push(docs.slice(i, i + batchSize));
        }

        for (const chunk of chunks) {
            const batch = db.batch();

            for (const doc of chunk) {
                const data = doc.data();
                const updates: any = {};

                // 1. friendsCount
                const friends = data.friends || [];
                updates.friendsCount = friends.length;

                // 2. searchKey
                if (data.displayName) {
                    updates.searchKey = data.displayName.toLowerCase();
                }

                // 3. _random
                updates._random = Math.floor(Math.random() * 1000000); // Random integer 0-999999

                batch.update(doc.ref, updates);
                processed++;
            }

            await batch.commit();
            console.log(`✅ Processed ${processed}/${totalUsers} users...`);
        }

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateUsers();
