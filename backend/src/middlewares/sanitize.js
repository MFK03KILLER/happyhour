const xss = require('xss');

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') obj[key] = xss(val);
    else if (typeof val === 'object' && val !== null) sanitizeObject(val);
  }
  return obj;
}

module.exports = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  next();
};
