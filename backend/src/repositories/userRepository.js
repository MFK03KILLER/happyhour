const User = require('../models/User');

module.exports = {
  findById: (id) => User.findById(id),
  findByEmail: (email) => User.findOne({ email: email.toLowerCase() }),
  create: (data) => User.create(data),
  update: (id, data) => User.findByIdAndUpdate(id, data, { new: true }),
  upsertByEmail: (email, data) => User.findOneAndUpdate({ email: email.toLowerCase() }, data, { new: true, upsert: true }),
  list: (filter = {}, opts = {}) => User.find(filter, null, opts),
  count: (filter = {}) => User.countDocuments(filter),
  delete: (id) => User.findByIdAndDelete(id),
  pushRefreshToken: (id, token) => User.findByIdAndUpdate(id, { $push: { refreshTokens: token } }),
  pullRefreshToken: (id, tokenHash) => User.findByIdAndUpdate(id, { $pull: { refreshTokens: { tokenHash } } }),
  clearRefreshTokens: (id) => User.findByIdAndUpdate(id, { refreshTokens: [] }),
};
