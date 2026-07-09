// Single source of truth for the Pro plan price.
// Both the UI (every "RM 29/mo" button/label) and the actual amount charged
// by api/create-checkout.js read from here — change monthly/yearly below
// (e.g. to test a lower price) and everything updates together, so a test
// price can never silently diverge from what's actually charged.
const PRO_PRICE_RM = { monthly: 29, yearly: 269 };
const PRO_YEARLY_SAVINGS = PRO_PRICE_RM.monthly * 12 - PRO_PRICE_RM.yearly;

module.exports = { PRO_PRICE_RM, PRO_YEARLY_SAVINGS };
