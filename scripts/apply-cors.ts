/**
 * Apply CORS configuration to Firebase Storage bucket.
 * Run: npx ts-node scripts/apply-cors.ts
 */
import { Storage } from '@google-cloud/storage';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVICE_ACCOUNT_PATH = resolve(__dirname, '..', 'firebase-service-account.json');
const BUCKET_NAME = 'bezkompreseapp.firebasestorage.app';

const CORS_CONFIG = [
    {
        origin: [
            'https://bezkompreseapp.web.app',
            'https://bezkompreseapp.firebaseapp.com',
            'http://localhost:5173',
        ],
        method: ['GET'],
        maxAgeSeconds: 86400,
        responseHeader: ['Content-Type', 'Content-Length'],
    },
];

async function main() {
    console.log('Applying CORS configuration to bucket:', BUCKET_NAME);

    const storage = new Storage({
        keyFilename: SERVICE_ACCOUNT_PATH,
    });

    const bucket = storage.bucket(BUCKET_NAME);

    await bucket.setCorsConfiguration(CORS_CONFIG);

    console.log('✅ CORS configuration applied successfully!');

    // Verify
    const [metadata] = await bucket.getMetadata();
    console.log('Current CORS config:', JSON.stringify(metadata.cors, null, 2));
}

main().catch((err) => {
    console.error('❌ Failed to apply CORS:', err.message);
    process.exit(1);
});
