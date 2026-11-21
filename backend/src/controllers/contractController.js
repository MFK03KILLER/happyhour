// Contracts: the admin keeps contract texts, sends a signing link to a
// merchant, the merchant signs on their phone, the signed copy is stored here.
const crypto = require('crypto');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const Contract = require('../models/Contract');
const ContractSignature = require('../models/ContractSignature');
const auditService = require('../services/auditService');
const mail = require('../services/mailService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const SIGN_BASE = 'https://happyhourz.org/merchant/sign/';
const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const linkFor = (doc) => SIGN_BASE + doc.token;
const parse = (schema, body) => {
  const r = schema.safeParse(body);
  if (!r.success) throw new BadRequestError(r.error.issues[0]?.message || 'Invalid input');
  return r.data;
};

const templateSchema = z.object({
  title: z.string().trim().min(1, 'Give the contract a title').max(200),
  body: z.string().trim().min(20, 'The contract text is too short').max(200000),
});
const sendSchema = z.object({
  contractId: z.string().regex(/^[a-f0-9]{24}$/i, 'Choose a contract'),
  recipientName: z.string().trim().min(1, 'Enter the signer or business name').max(200),
  recipientEmail: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  vendorId: z.string().regex(/^[a-f0-9]{24}$/i).optional().or(z.literal('')),
  note: z.string().max(1000).optional(),
  sendEmail: z.boolean().optional(),
});
const signSchema = z.object({
  name: z.string().trim().min(2, 'Type your full name').max(120),
  title: z.string().trim().max(120).optional(),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  agree: z.literal(true, { errorMap: () => ({ message: 'Tick the box to agree to the contract' }) }),
  signature: z.string()
    .startsWith('data:image/png;base64,', 'Draw your signature')
    .max(600000, 'Signature image is too large'),
});

// ---------- admin: contract texts ----------
exports.listTemplates = asyncHandler(async (req, res) => {
  const items = await Contract.find({ archived: false }).sort({ updatedAt: -1 }).lean();
  res.json({ items });
});

exports.createTemplate = asyncHandler(async (req, res) => {
  const data = parse(templateSchema, req.body);
  const doc = await Contract.create({ ...data, createdBy: req.user._id });
  await auditService.log({ actorUserId: req.user._id, action: 'contract.create', targetType: 'Contract', targetId: String(doc._id), req });
  res.status(201).json(doc);
});

exports.updateTemplate = asyncHandler(async (req, res) => {
  const data = parse(templateSchema, req.body);
  const doc = await Contract.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!doc) throw new NotFoundError('Contract not found');
  res.json(doc);
});

exports.archiveTemplate = asyncHandler(async (req, res) => {
  await Contract.findByIdAndUpdate(req.params.id, { archived: true });
  res.status(204).end();
});

// ---------- admin: sent copies ----------
exports.listSent = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: String(req.query.status) } : {};
  const items = await ContractSignature.find(filter).select('-body -signatureImage')
    .populate('vendorId', 'name').sort({ createdAt: -1 }).limit(500).lean();
  res.json({ items: items.map((i) => ({ ...i, link: linkFor(i) })) });
});

exports.getSent = asyncHandler(async (req, res) => {
  const doc = await ContractSignature.findById(req.params.id).populate('vendorId', 'name').lean();
  if (!doc) throw new NotFoundError('Not found');
  res.json({ ...doc, link: linkFor(doc), intact: sha256(doc.body) === doc.bodyHash });
});

exports.send = asyncHandler(async (req, res) => {
  const data = parse(sendSchema, req.body);
  const contract = await Contract.findById(data.contractId);
  if (!contract) throw new NotFoundError('Contract not found');
  const doc = await ContractSignature.create({
    contractId: contract._id,
    title: contract.title,
    body: contract.body,
    bodyHash: sha256(contract.body),
    token: crypto.randomBytes(24).toString('base64url'),
    recipientName: data.recipientName,
    recipientEmail: data.recipientEmail || undefined,
    vendorId: data.vendorId || undefined,
    note: data.note,
    createdBy: req.user._id,
  });
  let emailed = false;
  if (data.sendEmail && doc.recipientEmail) {
    emailed = await mail.send({
      to: doc.recipientEmail,
      subject: `Please sign: ${doc.title}`,
      text: `Hi ${doc.recipientName},\n\nHappy Hour has sent you "${doc.title}" to review and sign. Open this link on your phone or computer:\n\n${linkFor(doc)}\n\nHappy Hour`,
    }).catch(() => false);
  }
  await auditService.log({ actorUserId: req.user._id, action: 'contract.send', targetType: 'ContractSignature', targetId: String(doc._id), req });
  res.status(201).json({ ...doc.toObject(), link: linkFor(doc), emailed });
});

exports.voidSent = asyncHandler(async (req, res) => {
  const doc = await ContractSignature.findById(req.params.id);
  if (!doc) throw new NotFoundError('Not found');
  if (doc.status === 'signed') throw new BadRequestError('A signed contract cannot be voided');
  doc.status = 'voided';
  await doc.save();
  await auditService.log({ actorUserId: req.user._id, action: 'contract.void', targetType: 'ContractSignature', targetId: String(doc._id), req });
  res.json(doc);
});

// ---------- public: the signer ----------
async function byToken(token) {
  const doc = await ContractSignature.findOne({ token: String(token || '') });
  if (!doc) throw new NotFoundError('This signing link is not valid');
  return doc;
}

exports.publicGet = asyncHandler(async (req, res) => {
  const doc = await byToken(req.params.token);
  if (!doc.viewedAt && doc.status === 'pending') { doc.viewedAt = new Date(); await doc.save(); }
  res.json({
    title: doc.title,
    body: doc.body,
    status: doc.status,
    recipientName: doc.recipientName,
    recipientEmail: doc.recipientEmail,
    signedAt: doc.signedAt,
    signer: doc.status === 'signed' ? doc.signer : undefined,
  });
});

exports.publicSign = asyncHandler(async (req, res) => {
  const doc = await byToken(req.params.token);
  if (doc.status === 'signed') throw new BadRequestError('This contract has already been signed');
  if (doc.status === 'voided') throw new BadRequestError('This contract was withdrawn. Contact Happy Hour for a new link.');
  const data = parse(signSchema, req.body);
  doc.status = 'signed';
  doc.signedAt = new Date();
  doc.signer = { name: data.name, title: data.title || undefined, email: data.email || doc.recipientEmail || undefined };
  doc.signatureImage = data.signature;
  doc.signedIp = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
  doc.signedUserAgent = String(req.headers['user-agent'] || '').slice(0, 300);
  await doc.save();
  await auditService.log({ action: 'contract.sign', targetType: 'ContractSignature', targetId: String(doc._id), req });
  res.json({ status: 'signed', signedAt: doc.signedAt });
});
