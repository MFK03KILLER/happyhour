const Payment = require('../models/Payment');

module.exports = {
  findById: (id) => Payment.findById(id),
  create: (data) => Payment.create(data),
  listByCustomer: (customerId) => Payment.find({ customerId }).sort({ createdAt: -1 }),
};
