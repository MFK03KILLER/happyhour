const FeatureFlag = require('../models/FeatureFlag');

module.exports = {
  list: () => FeatureFlag.find().sort({ group: 1, sortOrder: 1, label: 1 }),
  enabledMap: async () => {
    const flags = await FeatureFlag.find({ enabled: true });
    const map = {};
    flags.forEach((f) => { map[f.key] = true; });
    return map;
  },
  publicList: () => FeatureFlag.find({ audience: { $in: ['all'] } }).select('key enabled label group'),
  findByKey: (key) => FeatureFlag.findOne({ key: key.toLowerCase() }),
  isEnabled: async (key) => {
    const f = await FeatureFlag.findOne({ key: key.toLowerCase() });
    return !!(f && f.enabled);
  },
  update: (key, data) => FeatureFlag.findOneAndUpdate({ key: key.toLowerCase() }, data, { new: true }),
  upsert: (key, data) => FeatureFlag.findOneAndUpdate({ key: key.toLowerCase() }, { ...data, key: key.toLowerCase() }, { new: true, upsert: true }),
};
