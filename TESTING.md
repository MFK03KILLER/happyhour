# Happy Hour — Testing Access Guide

**Server:** `http://130.185.120.120`

This is the demo of Happy Hour, a USA-based coupon & loyalty platform. The platform has **4 user roles** — please test each one using the credentials below.

---

## 🟢 1. Customer (end user buying coupons)

**What they do:** sign up, subscribe for $4.99/month, browse offers, claim coupons, show QR code at merchants, see order history.

### Login
- **URL:** http://130.185.120.120/
- **Email:** `customer1@happyhour.demo`
- **Password:** `Customer@123`

> Extra customers available: `customer2@happyhour.demo` and `customer3@happyhour.demo` (same password).

### Pages to test

| Page | URL | What to check |
|---|---|---|
| Landing page (public) | http://130.185.120.120/welcome | Hero, features, pricing, FAQ — visible without login |
| Sign in | http://130.185.120.120/login | Login form, demo creds prefilled |
| Sign up | http://130.185.120.120/register | New account creation |
| Home | http://130.185.120.120/ | Greeting, hero banner, categories, featured offers |
| Browse | http://130.185.120.120/browse | Search bar, category filters, scroll through coupons |
| Coupon detail | tap any coupon | Hero image, terms, locations, "Claim" button |
| Subscribe | http://130.185.120.120/subscribe | Monthly / Yearly toggle, Apple Pay mock |
| Wallet | http://130.185.120.120/wallet | Your claimed coupons + uses remaining |
| Redeem (QR) | tap "Show to merchant" in Wallet | QR with 60s countdown |
| Orders | http://130.185.120.120/orders | Past redemptions |
| Order detail | tap an order | Star rating + Picked-up card |
| Profile | http://130.185.120.120/profile | Membership status, settings menu |
| Payment methods | http://130.185.120.120/profile/payment-methods | Mock methods + add UI |
| Notifications | http://130.185.120.120/profile/notifications | Toggle switches |
| Help | http://130.185.120.120/profile/help | Support links |

### Full happy-path test
1. Open http://130.185.120.120/welcome → see landing
2. Click **Get started** → register or login with `customer1@happyhour.demo` / `Customer@123`
3. Subscribe for $4.99 (Apple Pay mock — no real charge)
4. Tap any coupon → **Claim coupon**
5. Wallet → **Show to merchant** → QR appears
6. (Now have a merchant scan it — see role 2)
7. After scan, screen jumps to **"Your order"** → rate with stars

---

## 🟡 2. Merchant staff (cashier / scanner)

**What they do:** open the merchant app, scan the customer's QR, see customer info, view recent redemptions, view location stats.

### Login
- **URL:** http://130.185.120.120/merchant/
- **Email:** `pizza.staff@happyhour.demo`
- **Password:** `Merchant@123`

> Other staff: `cafe.staff@happyhour.demo` (same password) — different merchant location.

### Pages to test

| Page | URL | What to check |
|---|---|---|
| Sign in | http://130.185.120.120/merchant/login | Login form |
| Scan | http://130.185.120.120/merchant/ | Big SCAN button + camera permission flow |
| History | http://130.185.120.120/merchant/history | Recent redemptions list |
| Stats | http://130.185.120.120/merchant/stats | Today / Week / Month + chart + top coupons |
| Store settings | http://130.185.120.120/merchant/settings | Merchant info (name, address, vendor, NFC) |

### Full happy-path test
1. Login → big **Scan a customer QR** button appears
2. Tap → camera permission prompt → **Allow** (this needs HTTPS or localhost; see note below)
3. Point camera at customer's QR (from role 1, step 5)
4. See **Redemption complete** with customer name, coupon, uses remaining
5. Check **History** tab — your redemption is there
6. Check **Stats** — counters incremented

> ⚠️ **Camera needs HTTPS.** Camera scanner doesn't work over plain HTTP on a public IP. For full scanner testing, use HTTPS (we have a self-signed cert option — see DEPLOYMENT.md). Otherwise, the rest of the merchant UI works fine over HTTP.

---

## 🔵 3. Vendor owner (business owner managing their brand)

**What they do:** manage their own merchant locations, create their own coupons, hire team members with permissions, see their vendor-wide stats.

### How to get credentials
**This role does NOT exist in the demo by default — you create it as the admin.** See role 4 step "Create a new vendor" — when you create the vendor, the system gives you the owner email + password to deliver.

For quick testing, ask the admin to create one with:
- Owner email: `owner@pizza.demo`
- Owner password: `Owner@12345`
- Vendor name: `Pizza My Heart`

### Login (after admin creates the user)
- **URL:** http://130.185.120.120/merchant/login
- Use the email + password the admin gave you

### Pages to test

| Page | URL | What to check |
|---|---|---|
| Vendor dashboard | http://130.185.120.120/merchant/vendor | Today/Week/Month redemption KPIs, permissions chip |
| Locations | http://130.185.120.120/merchant/vendor/merchants | List + "New location" |
| Coupons | http://130.185.120.120/merchant/vendor/coupons | List + create with image, price, uses, valid dates |
| Team | http://130.185.120.120/merchant/vendor/team | Add team member with role-specific permissions |

### Full happy-path test
1. Login with vendor creds → routed to `/merchant/vendor`
2. **Locations** → add a new store location
3. **Coupons** → create a new coupon, attach to your location(s)
4. **Team** → add a cashier with `scan_only` permission (use random email like `cashier@test.demo`, generate password)
5. Open new browser → log out as vendor, log in as the new cashier — they should see only the scan UI

### Permission levels for team members

| Permission | What it lets them do |
|---|---|
| `scan_only` | Just scan QR codes (cashier level) |
| `view_stats` | See redemption + revenue stats |
| `manage_coupons` | Create, edit, delete coupons |
| `manage_merchants` | Add new store locations |
| `manage_team` | Add/remove team members |

A vendor owner gets all permissions except `scan_only`. You can mix any combo on each team member.

---

## 🔴 4. Admin (platform super-admin — Happy Hour staff)

**What they do:** manage everything. Vendors, merchants, coupons, users, audit log, view all payments and revenue across the platform.

### Login
- **URL:** http://130.185.120.120/merchant/
- **Email:** `admin@happyhour.demo`
- **Password:** `Admin@12345`

### Pages to test

| Page | URL | What to check |
|---|---|---|
| Sign in | http://130.185.120.120/merchant/login | Login form |
| Dashboard | http://130.185.120.120/merchant/admin | Revenue KPIs (Today/Week/Month/All time) + recent payments preview |
| Revenue | http://130.185.120.120/merchant/admin/revenue | Range selector, daily trend chart, by-method bars, by-source breakdown, top customers |
| Payments | http://130.185.120.120/merchant/admin/payments | Full transaction log with filters + pagination |
| Vendors | http://130.185.120.120/merchant/admin/vendors | Create vendor + auto-generate owner login |
| Merchants | http://130.185.120.120/merchant/admin/merchants | Create individual locations |
| Coupons | http://130.185.120.120/merchant/admin/coupons | Create coupons platform-wide |
| Users | http://130.185.120.120/merchant/admin/users | All users in the system |
| Audit log | http://130.185.120.120/merchant/admin/audit | Every admin action recorded |

### Full happy-path test
1. Login → routed to `/merchant/admin` dashboard
2. Check revenue numbers (should reflect any subscription purchases from customer testing)
3. **Revenue** → toggle ranges (Today/Week/Month/Year), hover over chart bars
4. **Payments** → filter by method (Apple Pay), kind (Subscription), status
5. **Vendors** → **+ New vendor**:
   - Name: `Pizza My Heart Test`
   - Owner email: `owner@pizza.demo`
   - Owner password: tap **Generate** → save it
   - Click **Create vendor**
   - You'll see a green banner with the login credentials — copy them
6. Hand those credentials to whoever will test the vendor role (see role 3)
7. **Audit log** → verify your "vendor.create" action shows up

---

## 📋 Quick reference — all logins

| Role | Email | Password | Login URL |
|---|---|---|---|
| Customer | `customer1@happyhour.demo` | `Customer@123` | http://130.185.120.120/login |
| Customer | `customer2@happyhour.demo` | `Customer@123` | http://130.185.120.120/login |
| Customer | `customer3@happyhour.demo` | `Customer@123` | http://130.185.120.120/login |
| Merchant staff (pizza) | `pizza.staff@happyhour.demo` | `Merchant@123` | http://130.185.120.120/merchant/login |
| Merchant staff (cafe) | `cafe.staff@happyhour.demo` | `Merchant@123` | http://130.185.120.120/merchant/login |
| Vendor owner | _create via admin_ | _generated by admin_ | http://130.185.120.120/merchant/login |
| Admin | `admin@happyhour.demo` | `Admin@12345` | http://130.185.120.120/merchant/login |

---

## 🧪 Recommended testing order

1. **Admin** → check dashboard, create a test vendor with owner creds
2. **Vendor** (with newly created login) → add location, create coupon, hire cashier
3. **Customer** → register/login, subscribe, claim the vendor's coupon, show QR
4. **Merchant staff / new cashier** → scan customer's QR
5. **Customer** → see order confirmation with stars
6. **Admin again** → verify payment shows up in Revenue + Payments, audit log entry present

---

## 🆘 Issues?

- **API docs (Swagger):** http://130.185.120.120/api/docs
- **Health check:** http://130.185.120.120/health
- **GitHub repo:** https://github.com/MFK03KILLER/happyhour
