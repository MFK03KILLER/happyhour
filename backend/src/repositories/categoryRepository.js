const Category = require('../models/Category');

module.exports = {
  list: () => Category.find().sort({ sortOrder: 1 }),
  upsertBySlug: (slug, data) => Category.findOneAndUpdate({ slug }, data, { new: true, upsert: true }),
  findBySlug: (slug) => Category.findOne({ slug }),
};
