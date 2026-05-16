/**
 * Async Wrapper Middleware
 * Wraps async route handlers to automatically forward errors to Express
 * global error handler — eliminates boilerplate try/catch in every controller.
 *
 * Usage:
 *   router.post('/route', asyncWrapper(myAsyncController));
 */

const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncWrapper;
