const stripeService = require('../services/stripeService');
const subscriptionService = require('../services/subscriptionService');
const logger = require('../utils/logger');

// Mounted with express.raw() in app.js, so req.body is a Buffer here.
exports.webhook = async (req, res) => {
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripeService.verifyWebhook(req.body, sig);
  } catch (err) {
    logger.warn({ err: err.message }, 'Stripe webhook signature verification failed');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const kind = session.metadata && session.metadata.kind;
      // Route to the right fulfiller. Both handlers are idempotent, so Stripe
      // retrying a delivery can never grant the goods twice.
      if (kind === 'surprise_bag') {
        await require('../services/couponService').finalizeSurpriseBagCheckout(session);
      } else {
        await subscriptionService.finalizeStripeCheckout(session);
      }
    }
    return res.json({ received: true });
  } catch (err) {
    // Return 500 so Stripe retries; finalizeStripeCheckout is idempotent.
    logger.error({ err }, 'Stripe webhook handler failed');
    return res.status(500).json({ error: 'handler_failed' });
  }
};
