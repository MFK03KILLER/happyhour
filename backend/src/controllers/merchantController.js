const asyncHandler = require('../utils/asyncHandler');
const redemptionService = require('../services/redemptionService');
const statsService = require('../services/statsService');
const merchantService = require('../services/merchantService');
const { ForbiddenError } = require('../utils/errors');

function ensureMerchant(req) {
  if (!req.user.merchantId) throw new ForbiddenError('User not linked to merchant');
  return req.user.merchantId;
}

exports.scan = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const result = await redemptionService.scanByMerchant({
    scannedByUserId: req.user._id,
    merchantId,
    qrToken: req.body.qrPayload,
  });
  res.json(result);
});

exports.recent = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const items = await redemptionService.listMerchantRedemptions(merchantId, { skip: 0, limit: 50 });
  res.json({ items });
});

exports.stats = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const data = await statsService.merchantStats(merchantId);
  res.json(data);
});

exports.me = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const m = await merchantService.getById(merchantId);
  res.json(m);
});
