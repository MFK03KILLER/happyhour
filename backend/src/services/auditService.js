const auditRepo = require('../repositories/auditLogRepository');

async function log({ actorUserId, action, targetType, targetId, before, after, req }) {
  return auditRepo.create({
    actorUserId,
    action,
    targetType,
    targetId,
    before,
    after,
    ip: req ? (req.ip || req.headers['x-forwarded-for']) : undefined,
    ua: req ? req.headers['user-agent'] : undefined,
  });
}

async function list(opts) {
  const items = await auditRepo.list(opts);
  const total = await auditRepo.count();
  return { items, total };
}

module.exports = { log, list };
