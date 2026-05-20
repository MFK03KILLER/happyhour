const AuditLog = require('../models/AuditLog');

module.exports = {
  create: (data) => AuditLog.create(data),
  list: (opts = {}) => AuditLog.find({}, null, opts).populate('actorUserId', 'fullName email role').sort({ createdAt: -1 }),
  count: () => AuditLog.countDocuments(),
};
