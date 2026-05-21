const Subscription = require('../models/Subscription');

module.exports = {
  findByCustomer: (customerId) => Subscription.findOne({ customerId }),
  create: (data) => Subscription.create(data),
  update: (id, data) => Subscription.findByIdAndUpdate(id, data, { new: true }),
  upsertForCustomer: (customerId, data) => Subscription.findOneAndUpdate({ customerId }, data, { new: true, upsert: true }),
  pushPayment: (id, paymentId) => Subscription.findByIdAndUpdate(id, { $push: { payments: paymentId } }, { new: true }),
};
