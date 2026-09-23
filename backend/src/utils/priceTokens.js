// Live prices inside editable site content.
//
// Site content (FAQs, membership page, terms) is written by admins as markdown.
// A literal "$12.99" there goes stale the moment the price changes in the admin
// panel, so content uses tokens that are filled in with the current price when
// served:
//
//   {{price:gold:monthly}}            customer plan (default audience)
//   {{price:merchant:gold:yearly}}    merchant plan
const plans = require('../config/plans');

const TOKEN = /\{\{\s*price:(?:(customer|merchant):)?(basic|gold|premium):(monthly|yearly)\s*\}\}/g;

function formatUSD(n) {
  const value = Number(n) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function renderPriceTokens(text) {
  if (typeof text !== 'string' || !text.includes('{{')) return text;
  return text.replace(TOKEN, (match, audience, tier, period) =>
    formatUSD(plans.getPlan(tier, audience || 'customer').price[period]));
}

module.exports = { renderPriceTokens, formatUSD };
