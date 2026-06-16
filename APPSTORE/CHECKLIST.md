# ✅ Pre-Submission Checklist (har do app)

## A) Code / build (anjam shode ✅ ya bayad anjam beshe ⬜)
- [x] Capacitor 8 ezafe shod (`npm install` rooye Mac)
- [x] `capacitor.config.json` (appId, appName)
- [x] `vite.config.native.js` → base `'./'` (fix-e safhe sefid merchant)
- [x] `.env.native` → API base ghabel-e taghir
- [x] Service worker dar native khamoosh
- [x] Hash history baraye native (router)
- [x] Redirect-haye login baraye native dorost
- [x] Icon 1024 (opaque) + splash 2732
- [ ] **Domain-e HTTPS** toye `.env.native` (5.1) — ⬜ bad az kharid-e domain
- [ ] **Login native** Google + Sign in with Apple (5.2) — ⬜
- [ ] **Account deletion** dakhel-e app + backend `DELETE /account` (5.3) — ⬜
- [ ] **IAP** baraye subscription (5.4) — ⬜ tasmim

## B) Mac / Xcode
- [ ] Xcode 26+، Node 22+
- [ ] `npm install && npm run build:native && npx cap add ios && npx cap sync ios`
- [ ] `npx capacitor-assets generate --ios`
- [ ] Signing Team entekhab shod، Bundle ID dorost
- [ ] Info.plist: customer = `NSLocationWhenInUseUsageDescription`؛ merchant = `NSCameraUsageDescription`؛ har do = `ITSAppUsesNonExemptEncryption=NO`
- [ ] customer: capability **Sign in with Apple**
- [ ] Test rooye device-e vaghei (camera/location/no white screen)
- [ ] Archive → Upload

## C) App Store Connect (az Windows ham mishe)
- [ ] App ID + app record (har do)
- [ ] Metadata az file-haye `*-appstore-metadata.md`
- [ ] Screenshot: iPhone 6.9″ (1320×2868) + iPad 13″ (2064×2752) age iPad dari
- [ ] App Privacy questionnaire
- [ ] Export compliance (NO)
- [ ] **Privacy Policy URL** + **Support URL** (live!)
- [ ] Demo account (ba subscription faal baraye customer)
- [ ] Submit for Review

## D) Hesab/legal
- [x] Apple Developer account (dari ✔️)
- [ ] Legal entity (US/beynolmelali) baraye copyright + payout

---

### ⛔ 4 ta blocker-e asli (bedoon-e inha reject):
1. **HTTPS domain** baraye API
2. **Sign in with Apple** (chون Google login dari)
3. **In-app account deletion**
4. **Subscription payment** (IAP vs estedlal-e physical-goods)
