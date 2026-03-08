import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Získání argumentů z příkazové řádky (např. node set-version.js 1.0.1 12)
const args = process.argv.slice(2);
const newVersionString = args[0]; // e.g., "1.0.1"
const newBuildNumber = args[1]; // e.g., "12"

if (!newVersionString || !newBuildNumber) {
    console.error('❌ Chybí argumenty! Použití: node scripts/set-version.js <verze> <build>');
    console.error('💡 Příklad: node scripts/set-version.js 1.0.1 12');
    process.exit(1);
}

// Cesty k souborům
// Jelikož se skript spouští z root složky přes npm script, proces.cwd() bude kořen projektu
const packageJsonPath = resolve(process.cwd(), 'package.json');
const androidBuildGradlePath = resolve(process.cwd(), 'android/app/build.gradle');
const iosProjectPbxprojPath = resolve(process.cwd(), 'ios/App/App.xcodeproj/project.pbxproj');

try {
    // 1. Aktualizace package.json
    console.log('⌛ Aktualizuji package.json...');
    let packageJsonContent = readFileSync(packageJsonPath, 'utf8');
    packageJsonContent = packageJsonContent.replace(/"version": ".*"/, `"version": "${newVersionString}"`);
    writeFileSync(packageJsonPath, packageJsonContent);
    console.log(`✅ package.json: verze nastavena na ${newVersionString}`);

    // 2. Aktualizace Android (build.gradle)
    console.log('⌛ Aktualizuji Android (build.gradle)...');
    let androidGradleContent = readFileSync(androidBuildGradlePath, 'utf8');
    androidGradleContent = androidGradleContent.replace(/versionName\s+".*"/g, `versionName "${newVersionString}"`);
    androidGradleContent = androidGradleContent.replace(/versionCode\s+\d+/g, `versionCode ${newBuildNumber}`);
    writeFileSync(androidBuildGradlePath, androidGradleContent);
    console.log(`✅ Android: versionName = "${newVersionString}", versionCode = ${newBuildNumber}`);

    // 3. Aktualizace iOS (project.pbxproj)
    console.log('⌛ Aktualizuji iOS (project.pbxproj)...');
    let iosProjectContent = readFileSync(iosProjectPbxprojPath, 'utf8');
    iosProjectContent = iosProjectContent.replace(/MARKETING_VERSION\s*=\s*[^;]+;/g, `MARKETING_VERSION = ${newVersionString};`);
    iosProjectContent = iosProjectContent.replace(/CURRENT_PROJECT_VERSION\s*=\s*[^;]+;/g, `CURRENT_PROJECT_VERSION = ${newBuildNumber};`);
    writeFileSync(iosProjectPbxprojPath, iosProjectContent);
    console.log(`✅ iOS: MARKETING_VERSION = "${newVersionString}", CURRENT_PROJECT_VERSION = ${newBuildNumber}`);

    console.log('\n🎉 Všechny platformy byly úspěšně synchronizovány na novou verzi.');
    console.log('Nyní můžete spustit "npm run build" nebo "npx cap sync" pro propsání do nativních projektů.');

} catch (err) {
    console.error('❌ Nastala bída při zápisu do souborů:', err);
    process.exit(1);
}
