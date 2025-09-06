/* eslint-env node */
/* global process */
// eslint-disable-next-line no-unused-vars
export default (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  res.status(status).json({ message, details });
};
