const { BadRequestError } = require('../utils/errors');

module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new BadRequestError('Validation failed', result.error.flatten()));
  }
  req[source] = result.data;
  next();
};
