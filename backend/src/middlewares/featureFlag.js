const flagService = require('../services/featureFlagService');

module.exports = (key) => async (req, res, next) => {
  try {
    await flagService.requireEnabled(key);
    next();
  } catch (e) {
    next(e);
  }
};
