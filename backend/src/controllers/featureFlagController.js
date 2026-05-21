const asyncHandler = require('../utils/asyncHandler');
const flagService = require('../services/featureFlagService');
const auditService = require('../services/auditService');

exports.listAdmin = asyncHandler(async (req, res) => {
  const items = await flagService.list();
  res.json({ items });
});

exports.publicFlags = asyncHandler(async (req, res) => {
  const map = await flagService.publicMap();
  res.json({ flags: map });
});

exports.toggle = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { enabled } = req.body;
  const updated = await flagService.setEnabled(key, enabled);
  await auditService.log({
    actorUserId: req.user._id,
    action: 'feature.toggle',
    targetType: 'FeatureFlag',
    targetId: updated._id.toString(),
    after: { key, enabled: !!enabled },
    req,
  });
  res.json(updated);
});
