# 🤖 Happy Hour — Google Play Release Guide (Finglish)

Branch: **`android-release`** · Apps: **customer** (`app.happyhour.customer`) + **merchant** (`app.happyhour.merchant`)

---

## 0) Kholase: chi amade ast, chi bayad khodet anjam bedi

### ✅ VERIFIED — build-e vaghei test shod
Har do app **build shodand va emza shodand** (rooye VPS, chon Maven-e Google az Iran block-e):

| App | AAB | Size |
|---|---|---|
| customer | `app-release.aab` | ~5.1 MB |
| merchant | `app-release.aab` | ~4.0 MB |

- `jar verified` ✅ · signer SHA-256 = `1D:0D:23:A1:46:28:23:62:...:5C:89` (hamoon upload keystore-e ma)
- AGP 8.13.0 · certificate ta sale **2054** etebar dare

### ✅ Chizayi ke amade ast (man anjam dadam)
- Capacitor **Android platform** baraye har do app (`customer-app/android`, `merchant-app/android`)
- `compileSdk` / `targetSdk` = **36**, `minSdk` = **24** → motabegh ba elzam-e Play baraye 2026
- **Signing config** dar `app/build.gradle` ke az `android/keystore.properties` mikhoone (git-ignored)
- **Upload keystore** sakhte shod: `keystores/happyhour-upload.jks` (alias `happyhour`) + backup rooye VPS
- Permission-ha: customer = INTERNET + LOCATION + POST_NOTIFICATIONS · merchant = INTERNET + CAMERA
- `allowBackup=false` (token-haye login az adb backup dar nemiyad)
- **Do halat-e build** ba yek dastoor: `bundled` ya `remote` (bekhoon §2)
- Safahat-e ghanooni-ye public: `/privacy` , `/terms` , `/eula` , `/delete-account` (rooye site live)
- **Hazf-e account az dakhel-e app** (Play elzami karde) — Profile → Delete my account
- GitHub Actions workflow baraye build-e abri (`.github/workflows/android-build.yml`)

### ⚠️ Chizayi ke **bayad khodet** anjam bedi
1. Sakht-e **Google Play Developer account** ($25 yekbar) + identity verification
2. Upload-e AAB + por kardan-e Store listing / Data safety / Content rating
3. **Closed testing** (agar account-et shakhsi/personal bashe — bekhoon §4.2)
4. Screenshot-ha (az emulator ya gooshi vaghei)

---

## 1) Pish-niaz-ha

| Chiz | Version | Tozih |
|---|---|---|
| **JDK** | **21** | Capacitor 8 + AGP 8.13 be JDK 21 niaz dare (JDK 17 kafi nist) |
| **Android Studio** | 2024.2+ (Ladybug ya jadidtar) | ya faghat `cmdline-tools` |
| **Android SDK** | Platform **36** + Build-Tools **36** | Gradle khodesh download mikone agar license ghabool koni |
| **Node** | 20+ | |

> 💡 Agar nemikhay hichi nasb koni: **GitHub Actions** (§3.3) hame chiz ro abri build mikone va `.aab` ro behet mide.

---

## 2) MOHEMTARIN TASMIM: `bundled` ya `remote`?

Khastey-e to in bood ke **badan web ro update koni bedoone inke noskhe-ye jadid bedi**. Baraye hamin `remote` sakhtam.

```bash
node scripts/cap-config.mjs bundled   # asset-ha dakhel-e app
node scripts/cap-config.mjs remote    # app site-e live ro load mikone
```

| | **bundled** | **remote** ⭐ (khastey-e to) |
|---|---|---|
| Web files koja-and | dakhel-e APK/AAB | rooye `https://happyhourz.org` |
| Update-e web | **bayad noskhe-ye jadid bedi** be Play | **foran** — faghat deploy kon rooye server |
| Offline | kar mikone (UI load mishe) | kar nemikone (safhe sefid) |
| Load-e aval | fori | ~1-2 sanie (internet) |
| Plugin-haye native (camera/GPS/push) | ✅ | ✅ (chon site-e ma khodesh `@capacitor/core` dare) |

**Tosiye:** `remote` baraye har do app. Chon site-e to HTTPS-e vaghei dare va app plugin-haye native ro estefade mikone, moshkel-e policy nadare.

> ⚠️ Agar `remote` bezani, har taghiri ke rooye site bedi **fori** rooye app-e hameye user-ha mifte. Pas ghabl az deploy test kon.
>
> ⚠️ Yek chiz ro **hamishe** bayad noskhe-ye jadid bedi: taghir dar **native** (permission-e jadid, plugin-e jadid, icon, targetSdk). Faghat HTML/CSS/JS foori update mishe.

---

## 3) Build kardan-e `.aab`

### 3.1 — Yekbar: keystore
Keystore alan inja-st (**GOM NAKON — agar gom she dige nemitooni app ro update koni**):
```
C:\Users\predator\Desktop\Projects\happyhour\keystores\happyhour-upload.jks
alias: happyhour     (password toye happyhour-upload.PASSWORDS.txt)
backup: VPS → /root/keystores/
```
`android/keystore.properties` toye har do app be hamin file eshare mikone va **git-ignore** shode.

### 3.2 — ⛔ Build-e local (Windows) — **az Iran kar NEMIKONE**
> **Test shod:** `dl.google.com` (Maven-e Google) az internet-e Iran **block**-e. Hameye artifact-ha 404 midan (`Could not find com.android.tools.build:gradle:8.13.0`) — dar hali ke hamoon URL az VPS-e America **200** mide. Yani version-ha dorost-and, faghat shabake mahdood-e.
>
> Pas: ya **GitHub Actions** (§3.3 — sade-tarin), ya rooye **VPS**, ya ba **proxy/VPN** rooye Windows. Agar VPN dari, in dastoor-ha kar mikonan:


```bash
cd customer-app
npm install
node scripts/cap-config.mjs remote      # ya bundled
npm run build:native
npx cap sync android
cd android
./gradlew bundleRelease
```
Khorooji: `customer-app/android/app/build/outputs/bundle/release/app-release.aab`

Baraye merchant hamin ro ba `cd merchant-app` tekrar kon.

> Agar `./gradlew` error-e JDK dad: `set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21...`

### 3.3 — Build-e abri (bedoone nasb-e chizi)
1. Repo ro push kon (alan `android-release` rooye GitHub hast)
2. GitHub → **Settings → Secrets and variables → Actions** → in 4 ta ro besaz:
   - `ANDROID_KEYSTORE_BASE64` → base64-e file-e jks:
     ```powershell
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\predator\Desktop\Projects\happyhour\keystores\happyhour-upload.jks")) | Set-Clipboard
     ```
   - `ANDROID_KEYSTORE_PASSWORD` · `ANDROID_KEY_ALIAS` (= `happyhour`) · `ANDROID_KEY_PASSWORD`
3. GitHub → **Actions** → *Android Build* → **Run workflow** → app + mode ro entekhab kon
4. `.aab` ro az bakhsh-e **Artifacts** download kon

---

## 4) Google Play Console — gam be gam

### 4.1 — Account
1. <https://play.google.com/console> → **$25** (yekbar, hamishegi)
2. **Identity verification**: esm, address, shomare — chand rooz tool mikeshe. **Aval in ro shoroo kon** chon ta tamoom nashe nemitooni publish koni.
3. Noe account: **Personal** ya **Organization**. (Organization → D-U-N-S number mikhad vali mahdoodiat-e testing nadare.)

### 4.2 — ⚠️ Closed testing (faghat baraye account-haye **Personal**)
Agar account-e shakhsi baz kardi (bad az Nov 2023), Google mige ghabl az production bayad:
- Yek **closed test** rah bendazi
- Hadaghal **~12 tester** dashte bashi ke **~14 rooz peyvaste** opt-in bashan
- Baad darkhast-e **production access** bedi

> 📌 Adad-e daghigh (tedad-e tester va rooz) ro Google gah be gah avaz mikone — **Play Console khodesh** toye safhe "Production → Apply for production access" adad-e rooz ro neshoon mide. Hamoon ro melak begir.
>
> Rah-e sari': 12 ta email (doost/famil/email-haye khodet) ro toye closed test list bezar, azashoon bekhah link ro baz konan va app ro nasb konan.

### 4.3 — Sakht-e app
**All apps → Create app**:
- App name: `Happy Hour` (customer) / `Happy Hour Merchant`
- Language: English (US) · Type: **App** · **Free**
- Declarations ro tick kon

### 4.4 — Store listing (Grow → Main store listing)
| Field | Meghdar |
|---|---|
| Short description (≤80) | `Member deals at SF restaurants — save every day.` |
| Full description (≤4000) | Az `ANDROID/play-listing.md` copy kon |
| App icon | **512×512** PNG (32-bit, alpha) |
| Feature graphic | **1024×500** PNG/JPG (**ejbari**) |
| Phone screenshots | **hadaghal 2** (ta 8) — 16:9 ya 9:16, zel'e kootah ≥320px |
| Tablet screenshots | Ejbari nist vali baraye "designed for tablet" badge khoobe |

**Screenshot gereftan:** Android Studio → Device Manager → yek Pixel emulator besaz → app ro nasb kon → dokme-ye camera dar noar-e kenari.

### 4.5 — Policy → App content (hame ejbari)
| Bakhsh | Chi bezan |
|---|---|
| **Privacy policy** | `https://happyhourz.org/privacy` |
| **App access** | ⚠️ App-e ma login mikhad → **"All or some functionality is restricted"** → username + password-e test bede (`test@happyhour.demo` / password) + tozih bede chetori coupon claim kone |
| **Ads** | Na (ads nadarim) |
| **Content rating** | Porseshname-ye IARC ro por kon → dastee **Food & Drink / Lifestyle**. ⚠️ Chon offer-haye alcohol (bar/wine) darim, soal-e "references to alcohol" ro **Bale** bezan → rating احتمالاً Teen/16+ |
| **Target audience** | **18+** (be khater-e alcohol) — "Appeals to children" = No |
| **Data safety** | Bekhoon §4.6 |
| **Government apps / Financial features** | Na |
| **Health** | Na |

### 4.6 — Data safety (deghat kon — bayad ba Privacy Policy yeki bashe)
Chizayi ke app-e ma jam' mikone:

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| Name | ✅ | ❌ | App functionality, Account management | Required |
| Email address | ✅ | ❌ | App functionality, Account management | Required |
| Phone number | ✅ | ❌ | App functionality | Optional |
| **Approximate/Precise location** | ✅ | ❌ | App functionality (neshoon dadan-e ja-haye nazdik) | **Optional** |
| Purchase history | ✅ | ❌ | App functionality | Required |
| **Payment info** | ❌ | ❌ | — (Stripe handle mikone, be server-e ma nemiad) | — |
| App interactions / Crash logs | ✅ | ❌ | Analytics | Optional |

Va in do ta ro **حتماً** tick kon:
- ✅ *Data is encrypted in transit* (HTTPS darim)
- ✅ *Users can request that data be deleted* → URL: **`https://happyhourz.org/delete-account`**

### 4.7 — Upload va release
1. **Testing → Closed testing → Create new release**
2. AAB ro upload kon → Play mige *"Play App Signing"* → **قبول kon** (Google key-e asli ro negah midare, to faghat upload key dari)
3. **Release name**: `1.0.0 (1)` · **Release notes**: `First release.`
4. Tester-ha ro ezafe kon (email list) → **Review release → Start rollout**
5. Bad az ~14 rooz → **Production → Apply for production access** → baad **Create new release** rooye Production

⏱ Review-e app-e jadid mamoolan **chand saat ta chand rooz** tool mikeshe (bar khalaf-e Apple ke kondtar-e).

---

## 5) Update dadan-e badi

### Halat A — faghat web avaz shode (ba `remote`)
```bash
# rooye server
cd /var/www/happyhour && git pull
cd customer-app && npm run build
```
✅ Tamoom. App-e hame **fori** update mishe. **Hich kari ba Play nadari.**

### Halat B — chiz-e native avaz shode (permission, plugin, icon, targetSdk)
```bash
# versionCode ro +1 kon (ejbari — Play noskhe-ye tekrari ghabool nemikone)
# customer-app/android/app/build.gradle:  versionCode 2   versionName "1.0.1"
npm run build:native && npx cap sync android
cd android && ./gradlew bundleRelease
```
→ AAB-e jadid ro toye Play Console upload kon.

---

## 6) ⛔ Risk-haye rejection (hamin alan check kon)

| # | Risk | Vaziat-e ma |
|---|---|---|
| 1 | **Privacy policy** nabashe ya baz nashe | ✅ `https://happyhourz.org/privacy` (bedoone login baz mishe) |
| 2 | **Account deletion** nabashe | ✅ dakhel-e app (Profile) + safhe `/delete-account` |
| 3 | **App access** — reviewer natoone login kone | ⚠️ **BAYAD** user/pass-e test bedi (§4.5) |
| 4 | **Data safety** ba Privacy Policy nakhoone | ⚠️ Privacy Policy ro check kon ke location + email + purchase history ro gofte bashe |
| 5 | **Webview-e bi-arzesh** (Minimum Functionality) | ✅ camera (QR)، GPS، push، wallet — arzesh-e ezafe darim |
| 6 | **Alcohol content** | ⚠️ Target audience = 18+ bezan |
| 7 | **Google Play Billing** baraye subscription | ✅ Membership-e ma baraye **takhfif-e donya-ye vaghei** (restaurant) ast → mo'af az GPB. Vali toye tozih-e app benevis ke "membership for in-person discounts at partner venues" ta shak nakonan. |
| 8 | targetSdk pain | ✅ 36 |

---

## 6.5) ⚠️ Do ta mahdoodiat-e vaghei-ye WebView (ghabl az inke Google/Stripe ro roshan koni bekhoon)

### A) Google Sign-In **dakhel-e app kar nemikone**
Google az sale 2021 login-e OAuth ro dar **embedded WebView** block karde (`403 disallowed_useragent`).
Yani dokme-ye "Continue with Google" toye app-e Android kar **nakhahad** kard — hatta bad az inke `GOOGLE_CLIENT_ID` ro set koni.

**Vaziat-e feli:** `GOOGLE_CLIENT_ID` khali-ye → dokme "not configured" neshoon mide → **hich chizi nemishkane**.

**Vaghti khasti roshanesh koni, do rah dari:**
1. **Sade:** toye app-e native dokme-ye Google ro makhfi kon (faghat email/password). Web hamchenan Google dare.
2. **Doroste:** plugin-e native bezar — `@codetrix-studio/capacitor-google-auth` ya `@capacitor/browser` (Chrome Custom Tabs). In Google ro razi mikone chon WebView-e embedded nist.

### B) Stripe Checkout — hal shod ✅
Stripe Checkout rooye `checkout.stripe.com` ast (origin-e digar). Bedoone tanzim, WebView oon ro mifresad be browser-e system va user bad az pardakht be app barnemigarde.
Man `allowNavigation` ro ezafe kardam (`checkout.stripe.com`, `*.stripe.com`) → checkout **dakhel-e app** baz mishe va bad az pardakht khodesh barmigarde be `happyhourz.org/subscribe?checkout=success`.

> Bad az roshan kardan-e Stripe, **حتماً** yekbar rooye gooshi-ye vaghei test kon: kharid → bargasht be app → didan-e "Confirming your payment".

---

## 7) Command-haye khoolase

```bash
# build-e customer (remote mode)
cd customer-app && node scripts/cap-config.mjs remote && npm run build:native && npx cap sync android && cd android && ./gradlew bundleRelease

# build-e merchant
cd merchant-app && node scripts/cap-config.mjs remote && npm run build:native && npx cap sync android && cd android && ./gradlew bundleRelease

# baz kardan dar Android Studio (baraye emulator/screenshot)
cd customer-app && npx cap open android
```
