# Změny v projektu - Downgrade SDK a oprava verzí

Tento soubor dokumentuje změny provedené pro vyřešení konfliktů mezi `compileSdk 35` a knihovnami AndroidX, které vyžadovaly SDK 36.

## Provedené změny

### 1. `android/variables.gradle`
Snížil jsem verze klíčových knihoven AndroidX, aby byly kompatibilní s `compileSdk 35`. Novější verze (např. `androidx.core:1.17.0`) vyžadují `compileSdk 36`.

**Původní hodnoty (vyžadující SDK 36):**
- `androidxCoreVersion = '1.17.0'`
- `androidxActivityVersion = '1.11.0'`
- ... a další.

**Nové hodnoty (kompatibilní se SDK 35):**
- `androidxCoreVersion = '1.15.0'`
- `androidxActivityVersion = '1.10.1'`
- `androidxAppCompatVersion = '1.7.0'`
- `androidxFragmentVersion = '1.8.6'`
- `androidxWebkitVersion = '1.12.1'`
- `coreSplashScreenVersion = '1.0.1'`
- `androidxJunitVersion = '1.2.1'`
- `androidxEspressoCoreVersion = '3.6.1'`

### 2. `android/gradle.properties`
Nastavil jsem cestu k JDK 25, jak bylo požadováno.

- Přidáno: `org.gradle.java.home=C:/Program Files/Java/jdk-25.0.2`
- Odstraněno: Původní zakomentované/staré cesty k JDK 21/24.

## Jak se vrátit zpět
Pokud byste chtěli v budoucnu přejít na SDK 36:
1. V `android/variables.gradle` změňte `compileSdkVersion` a `targetSdkVersion` na `36`.
2. Aktualizujte verze knihoven v `variables.gradle` zpět na ty, které vyvolávaly chybu (např. `androidxCoreVersion = '1.17.0'`).
