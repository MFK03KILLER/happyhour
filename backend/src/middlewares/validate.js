const { BadRequestError } = require('../utils/errors');

// Rejects with the first problem in plain words ("Password needs at least 8
// characters"), so the apps can show it as-is; details stay in error.details.
module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const issue = result.error.issues[0];
    const generic = /^(Required|Invalid|Expected|String must|Number must)/.test(issue?.message || '');
    const message = !issue ? 'Validation failed'
      : generic && issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message;
    return next(new BadRequestError(message, result.error.flatten()));
  }
  req[source] = result.data;
  next();
};
