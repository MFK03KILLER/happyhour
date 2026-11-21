const mongoose = require('mongoose');

// One copy of a contract sent to one signer. The text is frozen when sent
// (bodyHash = sha256), so editing the template later never changes what was
// signed. Signed copies keep the drawn signature plus when/where it was signed.
const contractSignatureSchema = new mongoose.Schema({
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  title: { type: String, required: true },
  body: { type: String, required: true },
  bodyHash: { type: String, required: true },
  token: { type: String, required: true, unique: true, index: true },
  recipientName: { type: String, required: true, trim: true },
  recipientEmail: { type: String, trim: true, lowercase: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  note: String,
  status: { type: String, enum: ['pending', 'signed', 'voided'], default: 'pending', index: true },
  viewedAt: Date,
  signedAt: Date,
  signer: {
    name: String,
    title: String,
    email: String,
  },
  signatureImage: String,          // data:image/png;base64,...
  signedIp: String,
  signedUserAgent: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ContractSignature', contractSignatureSchema);
