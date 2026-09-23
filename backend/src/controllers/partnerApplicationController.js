const asyncHandler = require('../utils/asyncHandler');
const PartnerApplication = require('../models/PartnerApplication');
const auditService = require('../services/auditService');
const { NotFoundError } = require('../utils/errors');

// Public: a venue applies to join. Bots that fill the hidden `website` field get a
// normal-looking success response and nothing is stored.
exports.submit = asyncHandler(async (req, res) => {
  const { website, ...data } = req.body;
  if (website) return res.status(201).json({ ok: true });

  // One open application per email - a resubmit refreshes it instead of piling up.
  const existing = await PartnerApplication.findOne({ email: data.email, status: { $in: ['new', 'contacted'] } });
  if (existing) {
    Object.assign(existing, data);
    await existing.save();
    return res.status(201).json({ ok: true });
  }

  await PartnerApplication.create({ ...data, sourceIp: req.ip });
  res.status(201).json({ ok: true });
});

// Admin: list with an optional status filter, newest first.
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const limit = Math.min(parseInt(req.query.limit || '100', 10) || 100, 500);
  const [items, counts] = await Promise.all([
    PartnerApplication.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    PartnerApplication.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  res.json({
    items,
    counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
  });
});

// Admin: move an application through new -> contacted -> approved / rejected.
exports.update = asyncHandler(async (req, res) => {
  const before = await PartnerApplication.findById(req.params.id).lean();
  if (!before) throw new NotFoundError('Application not found');
  const patch = {};
  if (req.body.status) patch.status = req.body.status;
  if (typeof req.body.adminNotes === 'string') patch.adminNotes = req.body.adminNotes;
  patch.reviewedByUserId = req.user._id;
  patch.reviewedAt = new Date();
  const updated = await PartnerApplication.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true });
  await auditService.log({
    actorUserId: req.user._id, action: 'partner_application.update',
    targetType: 'PartnerApplication', targetId: String(updated._id), before, after: updated, req,
  });
  res.json(updated);
});
