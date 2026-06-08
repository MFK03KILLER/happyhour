const SiteSetting = require('../models/SiteSetting');

// ---------------- CONSUMER (customer) TOS ----------------
const DEFAULT_CONSUMER_TERMS_CONTENT = `# TERMS OF SERVICE

## AGREEMENT STRUCTURE

These Terms of Service ("Terms") consist of **Part 1 – General Terms and Conditions** and **Part 2 – Country-Specific Terms**, where applicable. The provisions contained in Part 2 may supplement, amend, or supersede provisions contained in Part 1. In the event of any inconsistency between Part 1 and Part 2, the provisions of Part 2 shall prevail.

# PART 1 – GENERAL TERMS AND CONDITIONS

## 1. Acceptance and Applicability of These Terms

This website and the Happy Hours mobile application (collectively, the "Platform") are owned and operated by **Happy Hours**, its subsidiaries, affiliates, successors, and assigns (collectively referred to as "Happy Hours," "Company," "we," "us," or "our").

These Terms govern your access to and use of the Platform, including all content, products, features, functionality, software, promotions, and services made available through the Platform on mobile devices, tablets, desktop computers, and other supported devices (collectively, the "Services").

These Terms apply whether you access the Platform as a visitor, registered user, subscriber, or member ("Member").

By accessing, downloading, registering for, purchasing, or using any Happy Hours product, membership, offer, service, or feature, you acknowledge that you have read, understood, and agree to be bound by:

- These Terms of Service;
- Our Privacy Policy;
- Any applicable Rules of Use;
- Any End User License Agreement (EULA); and
- Any supplemental terms applicable to specific products, services, promotions, or memberships.

If you do not agree to these Terms, you must immediately discontinue use of the Platform and Services.

You represent and warrant that you are at least eighteen (18) years old, or that you have obtained the consent of a parent or legal guardian who agrees to these Terms on your behalf. By using the Platform, you confirm that you have the legal capacity to enter into a binding agreement.

Parents and guardians are encouraged to supervise minors' use of the internet and make use of available parental control tools to restrict access to content they consider inappropriate.

## 2. Age-Restricted Content and Services

Certain sections of the Platform may contain references to, information about, or promotional offers involving alcoholic beverages, nightlife venues, entertainment experiences, or other age-restricted products and services ("Restricted Content").

Access to Restricted Content is permitted only to individuals who:

- Meet the minimum legal drinking age or age requirement in their country or jurisdiction;
- Are legally permitted to purchase or consume alcohol where they reside; and
- Are legally permitted to access such content from the location where they are using the Platform.

By accessing any Restricted Content, you confirm that you satisfy all applicable legal requirements.

If you do not meet these requirements, you must not access or use any Restricted Content available through the Platform.

Happy Hours shall not be responsible or liable for any violation of local laws, regulations, or age restrictions resulting from your access to or use of Restricted Content. Any such use is undertaken entirely at your own risk and responsibility.

## 3. Changes to These Terms

We reserve the right to modify, update, or replace these Terms at any time in our sole discretion. Changes may be necessary to reflect updates to our Services, business operations, legal requirements, technology, or membership offerings.

Any revised Terms will become effective immediately upon publication on the Platform unless otherwise stated.

Your continued use of the Platform following the posting of updated Terms constitutes your acceptance of the revised Terms. If you do not agree with any modification, your sole remedy is to discontinue use of the Platform and Services.

We encourage you to review these Terms periodically to stay informed of any updates.

## 4. Platform Access and Account Security

We may modify, suspend, restrict, discontinue, or remove any portion of the Platform, Services, memberships, or content at any time without prior notice.

We do not guarantee uninterrupted access to the Platform and shall not be liable if all or part of the Platform becomes unavailable for any period of time.

You are responsible for:

- Maintaining the equipment and internet access necessary to use the Platform;
- Ensuring that anyone accessing the Platform through your account or internet connection complies with these Terms;
- Providing accurate, current, and complete registration information;
- Maintaining the confidentiality of your login credentials; and
- Promptly notifying us of any unauthorized use of your account or security breach.

Your account is personal and may not be shared, sold, transferred, or assigned to another individual without our prior written consent.

We reserve the right to suspend, restrict, or terminate any account, username, password, membership, or access credential at any time if we reasonably believe that these Terms have been violated or that account activity presents a security, legal, or operational risk.

## 5. Purchases, Orders, and Refunds

When you purchase a membership, subscription, event, offer package, or other product through the Platform, your order constitutes an offer to purchase the selected product.

A purchase is considered completed only after:

1. Payment has been successfully processed; and
2. Happy Hours has issued confirmation through email, in-app notification, or another approved communication method.

We reserve the right to reject, suspend, or cancel any order at our sole discretion.

To prevent fraud and comply with applicable laws, we may require identity verification before completing a transaction.

### Refund Policy

Subject to applicable consumer protection laws, refunds may be issued only under the following circumstances:

- No offers, discounts, credits, or benefits associated with the purchased membership or product have been redeemed; and
- A refund request is submitted within thirty (30) days of purchase.

We may also issue refunds if:

- We cancel an order;
- We discontinue a purchased product before activation; or
- We terminate a membership in circumstances where a refund is legally required or deemed appropriate by us.

Approved refunds will generally be processed to the original payment method used for the transaction. Any banking fees, foreign exchange fees, payment processor charges, or similar costs may be deducted where permitted by law.
`;

// ---------------- MERCHANT TOS ----------------
const DEFAULT_MERCHANT_TERMS_CONTENT = `# HAPPY-HOURS MERCHANT TERMS AND CONDITIONS

## AGREEMENT STRUCTURE

These Merchant Terms and Conditions ("Terms") consist of Part 1 – General Terms and Conditions and Part 2 – Country-Specific Terms, where applicable. Part 2 may supplement, amend, or replace provisions contained in Part 1. In the event of any conflict between the provisions of Part 1 and Part 2, the provisions of Part 2 shall prevail.

# PART 1 – GENERAL TERMS AND CONDITIONS

## 1. Applicability and Acceptance of the Terms

The Happy-Hours Merchant Platform, including the Happy-Hours Merchant mobile application, merchant portal, website, and related services (collectively, the "Merchant Platform"), is operated by Happy-Hours, its affiliates, subsidiaries, successors, and assigns (collectively referred to as "Happy-Hours", "Company", "we", "us", or "our").

These Terms constitute a legally binding agreement between Happy-Hours and any business entity, merchant, venue, retailer, restaurant, service provider, or authorized representative ("Merchant", "you", or "your") that accesses or uses the Merchant Platform.

The Merchant Platform is specifically designed to allow participating merchants to manage offers, monitor redemptions, and validate digital coupons presented by consumers through the Happy-Hours consumer mobile application ("Consumer App").

By registering for, accessing, or using the Merchant Platform, you acknowledge that you have read, understood, and agree to be bound by:

- These Merchant Terms and Conditions;
- Any Merchant Participation Agreement;
- The Happy-Hours Privacy Policy;
- Merchant Program Guidelines;
- Any additional policies or operational procedures communicated by Happy-Hours.

If you do not agree to these Terms, you must immediately discontinue use of the Merchant Platform.

You represent and warrant that you are authorized to act on behalf of the Merchant and have full authority to legally bind the Merchant to these Terms.

## 2. Merchant Platform Purpose

The Merchant Platform is provided to facilitate the redemption and management of promotional offers made available through Happy-Hours.

Merchants may use the Merchant Platform to:

- Validate digital coupons displayed within the Consumer App;
- Redeem consumer offers and promotions;
- Track coupon usage and redemption activity;
- Manage merchant profiles and offer information;
- Review redemption reports and analytics;
- Communicate with Happy-Hours regarding merchant participation.

The Merchant agrees to honor all valid and properly presented coupons and offers in accordance with the published offer terms and any applicable Merchant Participation Agreement.

Happy-Hours reserves the right to verify coupon redemptions and audit merchant activity to ensure compliance with program requirements.

## 3. Changes to These Terms

Happy-Hours may modify or update these Terms from time to time to reflect operational, commercial, legal, or regulatory changes.

Any revised Terms shall become effective immediately upon publication on the Merchant Platform unless otherwise stated.

Your continued use of the Merchant Platform following publication of updated Terms constitutes acceptance of those revisions.

If you do not agree to any amendment, you must discontinue use of the Merchant Platform.

## 4. Merchant Account Registration and Security

To access certain features of the Merchant Platform, you may be required to create and maintain a merchant account.

You agree to:

- Provide accurate, current, and complete business information;
- Maintain and promptly update account information;
- Protect account credentials from unauthorized access;
- Restrict account access to authorized employees only;
- Notify Happy-Hours immediately of any suspected unauthorized access or security incident.

The Merchant is solely responsible for all activities conducted through its account, including activities performed by employees, agents, or representatives.

Happy-Hours reserves the right to suspend, restrict, or terminate any account where misuse, fraud, security concerns, or violations of these Terms are suspected.

## 5. Merchant Participation and Offer Redemption

By participating in the Happy-Hours program, the Merchant agrees to make available the offers, discounts, promotions, or benefits approved and published through the Consumer App.

The Merchant shall:

- Honor all valid coupons presented through the Consumer App;
- Redeem coupons only through approved redemption methods provided by Happy-Hours;
- Ensure staff members are trained in coupon validation procedures;
- Verify the authenticity and validity of coupons before redemption;
- Refrain from refusing valid coupon redemptions without legitimate business justification.

The Merchant acknowledges that the Merchant App serves as an official coupon verification and redemption tool and that redemption records generated through the Merchant Platform may be relied upon by Happy-Hours for reporting, settlement, auditing, and dispute resolution purposes.

## 6. Fraud Prevention and Prohibited Conduct

Merchants shall not:

- Redeem coupons without an actual customer transaction;
- Create false, duplicate, or misleading redemption records;
- Manipulate redemption statistics;
- Share merchant credentials with unauthorized parties;
- Reverse engineer, copy, modify, or interfere with the Merchant Platform;
- Use automated systems to artificially generate redemptions;
- Participate in any fraudulent activity involving consumers or third parties.

Happy-Hours may investigate any suspected abuse and may suspend or terminate merchant participation without prior notice.

## 7. Merchant Responsibilities

The Merchant is solely responsible for:

- The quality, availability, and delivery of products and services offered to consumers;
- Compliance with all applicable laws, licenses, permits, and regulatory requirements;
- Employee training regarding offer redemption procedures;
- Resolving customer service issues related to products and services provided by the Merchant.

Happy-Hours acts solely as a technology and promotional platform and is not responsible for products or services supplied by participating merchants.

## 8. Intellectual Property

All rights, title, and interest in the Merchant Platform, software, systems, trademarks, logos, content, reports, and related intellectual property remain the exclusive property of Happy-Hours or its licensors.

The Merchant receives a limited, non-exclusive, revocable license to use the Merchant Platform solely for participation in the Happy-Hours merchant program.

No ownership rights are transferred to the Merchant.

## 9. Suspension and Termination

Happy-Hours may suspend or terminate a Merchant's access to the Merchant Platform at any time where:

- These Terms are breached;
- Fraudulent activity is suspected;
- Consumer complaints indicate repeated non-compliance;
- Regulatory or legal concerns arise;
- Continued participation presents operational, reputational, or legal risks.

Upon termination, access to the Merchant Platform and all associated services may immediately cease.

## 10. Disclaimer of Warranties

The Merchant Platform is provided on an "as-is" and "as-available" basis.

Happy-Hours does not guarantee:

- Uninterrupted platform availability;
- A specific number of customer visits;
- Revenue generation;
- Redemption volume;
- Business growth or marketing outcomes.

To the fullest extent permitted by law, all express and implied warranties are disclaimed.

## 11. Limitation of Liability

To the maximum extent permitted by law, Happy-Hours shall not be liable for any indirect, incidental, consequential, punitive, or special damages arising from:

- Use of the Merchant Platform;
- Coupon redemptions;
- Consumer disputes;
- Platform interruptions;
- Loss of profits, revenue, goodwill, or business opportunities.

## 12. Governing Law and Jurisdiction

These Terms shall be governed by and interpreted in accordance with the laws specified in the applicable Merchant Participation Agreement or, where no such agreement exists, the laws of the jurisdiction in which Happy-Hours is registered.

Any dispute arising from these Terms shall be subject to the exclusive jurisdiction of the competent courts of that jurisdiction.

## 13. Contact Information

Questions regarding these Merchant Terms may be directed to:

Merchant Support Department

Email: merchant-support@happy-hours.com

Address: [Insert Registered Office Address]

By accessing or using the Merchant Platform, the Merchant acknowledges that it has read, understood, and agreed to be legally bound by these Terms and Conditions.
`;

// Keys we use for the two TOS documents.
const KEY_CONSUMER = 'terms_consumer';
const KEY_MERCHANT = 'terms_merchant';
// Legacy key kept readable for back-compat with very early seeds.
const KEY_LEGACY = 'terms';

// ------------- Footer / About-section content blocks -------------
// 12 small markdown documents the customer-app footer links to.
// Editable from the admin panel; each block has an independent version.
// Keys are prefixed with `content_` to keep them out of the terms namespace.
const SITE_CONTENT_BLOCKS = [
  // Section: Membership
  { key: 'content_membership_2026', section: 'membership', title: '2026 Membership' },
  { key: 'content_membership_vip',  section: 'membership', title: 'VIP Key' },
  // Section: Company
  { key: 'content_company_partner', section: 'company', title: 'Become a Partner' },
  { key: 'content_company_corporate', section: 'company', title: 'Corporate' },
  { key: 'content_company_careers', section: 'company', title: 'Careers' },
  { key: 'content_company_about', section: 'company', title: 'About' },
  // Section: Help & Support
  { key: 'content_help_faqs', section: 'help', title: 'FAQs' },
  { key: 'content_help_rules', section: 'help', title: 'Rules of Use' },
  { key: 'content_help_contact', section: 'help', title: 'Contact Us' },
  // Section: Legal (Terms of Use here is intentionally NOT included —
  // the footer link for "Terms of Use" opens the existing consumer
  // TOS, so it stays in one place.)
  { key: 'content_legal_eula', section: 'legal', title: 'End User License' },
  { key: 'content_legal_privacy', section: 'legal', title: 'Privacy Policy' },
];

const PLACEHOLDER_CONTENT = (title) => `# ${title}

> ⚠️ **PLACEHOLDER** — replace this from the admin panel (Admin → Site Content → ${title}).

This section is currently using placeholder text. The administrator will populate the real content shortly.

## What goes here

This page is reserved for the **${title}** content. Once the team provides the final copy, an admin can paste it in via the admin panel and it will show up here instantly for every visitor.

## Contact

If you need this content sooner, please reach out to our team.
`;

const DEFAULTS = {
  [KEY_CONSUMER]: {
    audience: 'consumer',
    version: 1,
    content: DEFAULT_CONSUMER_TERMS_CONTENT,
    updatedAt: new Date(),
  },
  [KEY_MERCHANT]: {
    audience: 'merchant',
    version: 1,
    content: DEFAULT_MERCHANT_TERMS_CONTENT,
    updatedAt: new Date(),
  },
  ...Object.fromEntries(SITE_CONTENT_BLOCKS.map((b) => [
    b.key,
    {
      key: b.key,
      section: b.section,
      title: b.title,
      version: 1,
      content: PLACEHOLDER_CONTENT(b.title),
      updatedAt: new Date(),
    },
  ])),
};

function keyFor(audience) {
  return audience === 'merchant' ? KEY_MERCHANT : KEY_CONSUMER;
}

async function get(key) {
  const found = await SiteSetting.findOne({ key });
  if (found) return found.value;
  return DEFAULTS[key] || null;
}

async function set(key, value, userId) {
  const existing = await SiteSetting.findOne({ key });
  if (existing && existing.value && typeof existing.value === 'object' && existing.value.version != null) {
    value.version = (existing.value.version || 1) + 1;
  } else {
    value.version = value.version || 1;
  }
  value.updatedAt = new Date();
  return SiteSetting.findOneAndUpdate(
    { key },
    { $set: { value, updatedBy: userId } },
    { upsert: true, new: true },
  );
}

async function ensureSeed() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const existing = await SiteSetting.findOne({ key });
    if (!existing) {
      await SiteSetting.create({ key, value });
    }
  }
  // One-time migration: if there's a legacy single 'terms' row (older than
  // the audience split) AND we haven't seeded 'terms_consumer' yet from it,
  // copy its content over so we don't lose an admin's hand-edited text.
  const legacy = await SiteSetting.findOne({ key: KEY_LEGACY });
  const consumerRow = await SiteSetting.findOne({ key: KEY_CONSUMER });
  if (legacy && consumerRow && consumerRow.value.content === DEFAULT_CONSUMER_TERMS_CONTENT) {
    consumerRow.value = {
      audience: 'consumer',
      version: legacy.value.version || 1,
      content: legacy.value.content,
      updatedAt: legacy.value.updatedAt || new Date(),
    };
    await consumerRow.save();
  }
}

async function getTerms(audience = 'consumer') {
  const v = await get(keyFor(audience));
  return v || DEFAULTS[keyFor(audience)];
}

async function updateTerms({ audience = 'consumer', content, userId }) {
  return set(keyFor(audience), { audience, content }, userId);
}

// ------------- Site content blocks -------------
function isContentKey(key) {
  return SITE_CONTENT_BLOCKS.some((b) => b.key === key);
}

async function getContent(key) {
  if (!isContentKey(key)) return null;
  const v = await get(key);
  return v || DEFAULTS[key];
}

async function listContent() {
  // Returns every block in stable order; uses live DB value if present, otherwise default.
  const out = [];
  for (const b of SITE_CONTENT_BLOCKS) {
    const v = await get(b.key);
    out.push(v || DEFAULTS[b.key]);
  }
  return out;
}

async function setContent({ key, title, content, userId }) {
  if (!isContentKey(key)) throw new Error('Unknown content key: ' + key);
  const block = SITE_CONTENT_BLOCKS.find((b) => b.key === key);
  // Title is editable too (in case the client renames "VIP Key" → "Black Card" later, etc.)
  return set(key, {
    key,
    section: block.section,
    title: title || block.title,
    content,
  }, userId);
}

module.exports = {
  get, set, ensureSeed,
  getTerms, updateTerms,
  getContent, listContent, setContent, isContentKey,
  KEY_CONSUMER, KEY_MERCHANT, KEY_LEGACY,
  SITE_CONTENT_BLOCKS,
  DEFAULTS,
};
