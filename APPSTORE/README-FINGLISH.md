# 🍏 Happy Hour — iOS App Store Guide (Finglish)

Rahnamaye kamel baraye build kardan va publish kardan-e **do ta app** rooye App Store:

| App | Bundle ID (pishnahadi) | Folder | Toozihat |
|-----|------------------------|--------|----------|
| **Happy Hour** (customer) | `app.happyhour.customer` | `customer-app/` | app-e moshtari: didan-e deal-ha, kharid, QR redemption |
| **Happy Hour Merchant** | `app.happyhour.merchant` | `merchant-app/` | app-e foroshande: scan-e QR, modiriat-e coupon, admin |

> In versione **English** ast (branch `main` → branch `ios-release`) va baraye market-e **US/beynolmelali** ast. Versione Farsi/Iran dakhel-e in kar nist (be khatere tahrim-ha rooye App Store ghabel-e enتشار nist).

---

## 0) خلاصه: چی آماده‌ست، چی مونده

### ✅ Chizayi ke man (Claude) anjam dadam — amade ast:
1. **Capacitor 8** be har do app ezafe shod (`@capacitor/core`, `cli`, `ios` + plugin-ha). Faghat `npm install` mikhad.
2. **`capacitor.config.json`** baraye har do app (appId, appName, splash...).
3. **`vite.config.native.js`** baraye har do app — base ro `'./'` mikone (in moshkel-e safhe sefid `/merchant/` ro hal mikone).
4. **`.env.native`** — adres-e backend (HTTPS) ke ye jaye moshakhas ghabel-e taghir ast.
5. **Code-haye native:** service worker dar app-e native khamoosh shod, routing be **hash history** avaz shod (vagarna safhe sefid), redirect-haye login baraye native dorost shod.
6. **Icon va Splash** (`assets/icon-only.png` 1024×1024 opaque + `splash.png`/`splash-dark.png` 2732×2732) — amade va standard-e Apple.
7. Metn-e kamel-e **App Store Connect** (description, keywords, privacy javab-ha, review notes) → file-haye `APPSTORE/*-appstore-metadata.md`.
8. Script-e **build:native** dar `package.json`.

### ⚠️ Chizayi ke **bayad khodet** anjam bedi (man az rooye Windows nemitoonam):
1. **Build-e nahayi rooye Mac** — `.ipa` faghat ba **Xcode rooye macOS** ba certificate-haye **Apple account-e khodet** sakhte mishe. (marhale 2 paeen)
2. **Domain + HTTPS** baraye backend — `.env.native` ro be domain-e vagheei avaz kon (Apple `http`/IP ro block mikone).
3. **Login-e native** (Google + Apple) — SDK-e web-i toye app kar nemikone (paeen tozih dadam).
4. **Hazf-e hesab dakhel-e app** (Account Deletion) — Apple ejbari mikone.
5. **Tasmim baraye payment-e subscription** (IAP vs Stripe) — mohemtarin risk-e reject.

> In file ro ta akhar bekhoon. Bakhsh **5** (kar-haye ejbari ghabl az submit) khatarnaktarin bakhshe — bedoon-e oon reject mishi.

---

## 1) پیش‌نیازها (Prerequisites)

- ✅ **Mac** ba **Xcode 26+** (SDK-e iOS 26 — az 28 April 2026 ejbari shode baraye upload).
- ✅ **Node.js 22+** rooye Mac (Capacitor 8 lazem dare). Check: `node -v`.
- ✅ **Apple Developer Program** account ($99/sal) — to dari. ✔️
- ⏳ **Domain + HTTPS** baraye backend (chand rooz dige migiri).
- ✅ Git baraye clone kardan-e branch `ios-release`.

---

## 2) مرحله به مرحله: Build روی Mac

In marhale-ha ro **rooye Mac** anjam bede. Baraye **har do app** jodagane tekrar mishe (aval customer, baad merchant).

### 2.1 — Clone & install
```bash
git clone https://github.com/MFK03KILLER/happyhour.git
cd happyhour
git checkout ios-release          # branch-e iOS

cd customer-app                   # ya merchant-app
npm install                       # hamه dependency-ha + Capacitor
```

### 2.2 — Domain-e backend ro bezar
File `.env.native` ro baz kon va adres-e API ro avaz kon:
```
VITE_API_BASE=https://api.YOUR-DOMAIN.com/api/v1
```
(felan `https://api.happyhour.app/api/v1` gozashtam — domain-e vagheei ro ke gerefti bezar.)

### 2.3 — Build-e native + ezafe kardan-e iOS
```bash
npm run build:native              # dist/ ro ba base './' va API-e HTTPS misaze
npx cap add ios                   # folder-e ios/ (project-e Xcode) ro misaze — faghat rooye Mac
npx cap sync ios                  # dist + plugin-haye native ro copy mikone
```

### 2.4 — Icon va Splash (yebar)
```bash
npx capacitor-assets generate --ios
# az rooye assets/icon-only.png (1024) va assets/splash.png (2732) hame size-ha ro misaze
npx cap sync ios
```

### 2.5 — Baz kardan-e Xcode
```bash
npx cap open ios
```
Toye Xcode (target-e "App"):
1. **Signing & Capabilities** → **Team**-et ro entekhab kon (Apple account-et). "Automatically manage signing" ro tik bezan.
2. **Bundle Identifier** = `app.happyhour.customer` (ya merchant). Bayad ba App ID-e toye App Store Connect yeki bashe.
3. **Deployment target** = iOS 15+.
4. **Info.plist** — in key-ha ro ezafe kon (bakhsh 2.7).
5. **App Icon** → toye Asset Catalog, icon ro rooye **"Single Size"** bezar (Xcode khodesh hame size ro misaze).
6. Faghat customer-app: capability-e **Sign in with Apple** ro ezafe kon (va Push age push mikhay).

### 2.6 — Test rooye device/simulator
- Toye Xcode، **Run** (▶) bezan rooye simulator ya iPhone-e vaghei.
- Check kon: safhe sefid nashe (base path), API vasl beshe (HTTPS), camera (merchant) permission bekhad, geolocation (customer) permission bekhad.
- **Camera (merchant):** rooye device-e vagheei test kon (simulator camera nadare).

### 2.7 — Info.plist (matn-haye permission)

**customer-app** (`ios/App/App/Info.plist`):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Your location is used to show nearby participating restaurants and calculate distances.</string>
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

**merchant-app:**
```xml
<key>NSCameraUsageDescription</key>
<string>The camera is used to scan customer QR codes to redeem coupons at the counter.</string>
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```
> ⚠️ customer-app **camera nadare** — pas NSCameraUsageDescription ro ezafe **nakon** (permission-e ezafi reject miyare). merchant-app ham location nadare.

### 2.8 — Archive & Upload
1. Bالای Xcode، device ro rooye **"Any iOS Device (arm64)"** bezar.
2. **Product → Archive**.
3. Vaghti tamoom shod، **Distribute App → App Store Connect → Upload**.
4. Chand daghighe bad، build toye App Store Connect → TestFlight peyda mishe.

---

## 3) App Store Connect (az rooye Windows ham mishe)

Site: https://appstoreconnect.apple.com

### 3.1 — Sakht-e App ID & app record (baraye har do)
1. **Certificates, Identifiers & Profiles** → **Identifiers** → **+** → App ID → Bundle ID = `app.happyhour.customer` (va baadan merchant). Capability-e **Sign in with Apple** ro baraye customer faal kon.
2. **App Store Connect → My Apps → +** → New App. Platform = iOS، Bundle ID ro entekhab kon، SKU dele-khah، Name = "Happy Hour" / "Happy Hour Merchant".

### 3.2 — Metadata
Hame field-ha (Name, Subtitle, Description, Keywords, ...) ro az in file-ha copy kon:
- 📄 `APPSTORE/customer-appstore-metadata.md`
- 📄 `APPSTORE/merchant-appstore-metadata.md`

### 3.3 — Screenshot-ha (ejbari)
Rooye Mac simulator، az app screenshot begir. Faghat 2 size lazem ast (Apple baghie ro khodesh klearn mikone):
- **iPhone 6.9″** → `1320 × 2868` (ya `1290 × 2796`)
- **iPad 13″** → `2064 × 2752` (faghat age app-et iPad ham support mikone؛ vagarna app ro "iPhone only" bezar)
- Beyne 1 ta 10 ta. PNG/JPG، bedoon-e transparency.
- ⚠️ Screenshot bayad app-e **dar hال-e estefade** ro neshoon bede (didan-e deal، map، QR) — na faghat safhe login.

### 3.4 — App Privacy
Toye `Privacy` → questionnaire ro por kon (javab-ha toye file-haye metadata hast).

### 3.5 — Export Compliance
`ITSAppUsesNonExemptEncryption = NO` (toye Info.plist gozashtim) → questionnaire-e export skip mishe.

### 3.6 — Demo account (ejbari baraye review)
Toye `App Review Information`:
- "Sign-in required" ro tik bezan.
- Username/Password-e ye account-e **vaghei va kar-konande** bede (matn toye file-haye metadata).
- ⚠️ customer demo account bayad **subscription-e faal** dashte bashe ta reviewer catalog ro bebine.

### 3.7 — Submit
Build ro be version vasl kon → **Submit for Review**.

---

## 4) آیکون و Splash (jozئiat)

File-haye amade:
- `customer-app/assets/icon-only.png` (1024×1024، opaque) + `splash.png` + `splash-dark.png` (2732×2732)
- `merchant-app/assets/...` (hamintor، ba tarrahi-e dark + scan-frame)

Dastoor-e generate (rooye Mac، bad az `npx cap add ios`):
```bash
npx capacitor-assets generate --ios
```
Age khasti khodet icon-ha ro avaz koni، file-haye `assets/icon-only.png` ro replace kon (1024×1024، **bedoon-e alpha/transparency**) va dobare generate kon. Script-e sakht: `APPSTORE/tools/gen-icons.mjs`.

---

## 5) ⛔ کارهای اجباری قبل از Submit (BLOCKERS)

In char ta bedoon-e shak reject miyaran age dorost nashan:

### 5.1 — HTTPS domain (هм fani، هم review)
Apple `http://` va IP ro block mikone (App Transport Security). Bayad backend rooye **HTTPS ba certificate-e mo#tabar** bashe. Vaghti domain ro gerefti، `.env.native` ro avaz kon va dobare `npm run build:native && npx cap sync ios`.
> Pishnahad-e arzoon va sari: domain + **Cloudflare** (TLS-e majani) ya **Let's Encrypt** rooye server.

### 5.2 — Login-e Google/Apple native (Guideline 4.8)
SDK-e web-i Google (`accounts.google.com/gsi`) toye WKWebView **kar nemikone** (error: `disallowed_useragent`). Va chون Google login dari، Apple **Sign in with Apple** ro **ejbari** mikone.
- Plugin-ha:
  ```bash
  npm i @codetrix-studio/capacitor-google-auth @capacitor-community/apple-sign-in
  ```
- `loginWithGoogle()` ro be `GoogleAuth.signIn()` vasl kon، va Sign in with Apple ro ezafe kon + capability toye Xcode.
- **Rah-e sade baraye versione aval:** age nemikhay alan dorostesh koni، dakhel-e app-e native dokme-haye Google/Apple ro **makhfi kon** va faghat email/password bezar — injoori reject-e 4.8 nemikhori. (vali email/password bायد kar kone.)

### 5.3 — Account Deletion dakhel-e app (Guideline 5.1.1(v))
Har app-i ke account misaze BAYAD ye dokme-ye "Delete Account" dakhel-e app dashte bashe (na faghat web). Lazem dare:
- Backend: ye endpoint mesle `DELETE /account` (hala nist — bayad ezafe she).
- UI: toye `Profile` (customer) va settings (merchant) ye dokme-ye hazf-e hesab.
- Age Sign in with Apple dari، bayad token ro ba Apple REST API revoke koni.

### 5.4 — Payment-e subscription (Guideline 3.1.1 vs 3.1.3) — MOHEMTARIN
In bozorgtarin risk-e reject ast:
- **Subscription** (ke catalog-e coupon ro baz mikone) → Apple معمولاً migه bayad **In-App Purchase (IAP)** bashe (30% sal-e aval، 15% baad). Mesle ClassPass mishe estedlal kard ke "membership baraye khadamat-e vaghei-e donya"st، vali risk dare.
- **Surprise bag** (ghaza-ye vaghei baraye pickup) → in **physical good** ast، pas BAYAD ba **Apple Pay / card** bashe، **na IAP**.
- **Pishnahad-e man:** IAP ro baraye subscription pياde-sازi kon (kamtarin risk)، va surprise bag ro ba Apple Pay/card negah dar. Do tarz-e payment ro toye code joda negah dar.
> In ye tasmim-e business ast — ba ham migim chejoori pияde konim vaghti residi be in marhale.

---

## 6) خلاصه‌ی ریسک‌های رد شدن (Rejection risks)

| # | Risk | Hal |
|---|------|-----|
| 1 | API rooye `http`/IP | HTTPS + domain |
| 2 | Google login toye webview | native plugin + Sign in with Apple |
| 3 | Account deletion nadari | dokme-ye hazf dakhel-e app |
| 4 | Subscription bedoon-e IAP | IAP yا estedlal-e 3.1.3(e) |
| 5 | Demo account kar nemikone | account-e vaghei ba subscription-e faal |
| 6 | Privacy Policy URL nadari | safhe-ye vaghei (template: `APPSTORE/privacy-policy-TEMPLATE.md`) |
| 7 | Screenshot faghat login | screenshot-e app dar hal-e estefade |
| 8 | App khali/thin (4.2) | feature-haye native (map، QR، location) ro neshoon bede |

---

## 7) FAQ

**Q: Chera khodet `.ipa` nasakhti?**
A: Build-e iOS faghat rooye **macOS ba Xcode** va ba **certificate-haye Apple account-e khodet** mishe — rooye Windows mom­ken nist (mahdoodiat-e Apple، na man). Vali hame chiz amade ast ke rooye Mac-et faghat ba `npm install && npm run build:native && npx cap add ios && npx cap open ios` beresi be app-e dar hal-e ejra.

**Q: Build-e cloud chi? Bedoon-e Mac mishe?**
A: Are — file-e `.github/workflows/ios-build.yml` ham gozashtam (GitHub Actions ba macOS runner). Vali signing be certificate-haye to (secrets) niaz dare. Chون Mac dari، rah-e Mac sade-tar ast.

**Q: Bundle ID ro avaz konam?**
A: Mitooni. Faghat bayad **unique** bashe va behtare reverse-DNS-e domain-e khodet bashe (mesle `com.yourbrand.customer`). Toye `capacitor.config.json` (`appId`) + Xcode + App Store Connect bayad yeki bashan.

**Q: Versione Farsi chi?**
A: Dast nazadam (branch `farsi`). In kar faghat rooye versione English (`ios-release`) ast.

---

Har soali dashti، bepors. Vaghti domain-e backend ro gerefti behem bede ta `.env.native` ro dorost konam va versione amade-ye submit ro besazim. 🚀
