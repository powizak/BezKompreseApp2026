import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Načtení service account klíče
// Pokud klíč nemáte: ve Firebase Console jděte do Project Settings -> Service accounts -> Generate new private key
// Uložte ho do kořene projektu jako 'serviceAccountKey.json'
let serviceAccount;
try {
    serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
} catch (error) {
    console.error('❌ Nelze načíst serviceAccountKey.json. Ujistěte se, že soubor existuje v kořenové složce projektu.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupVersionConfig() {
    console.log('⌛ Zapisuji konfiguraci aplikace do Firestore...');

    try {
        const docRef = db.collection('app-settings').doc('version');

        await docRef.set({
            minVersion: '1.0.0',
            playStoreUrl: 'https://play.google.com/store/apps/details?id=cz.placeholder.app',
            appStoreUrl: 'https://apps.apple.com/cz/app/placeholder/id000000000'
        }, { merge: true }); // Používáme merge, aby se nepřepsala jiná případná data v dokumentu

        console.log('✅ Konfigurace verze (1.0.0) byla úspěšně uložena do app-settings/version.');
    } catch (error) {
        console.error('❌ Nastala chyba při zápisu do databáze:', error);
    }
}

setupVersionConfig();
