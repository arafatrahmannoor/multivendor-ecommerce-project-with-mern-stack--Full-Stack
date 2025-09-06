import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

// Limit password change attempts: per user (route param :id), fallback to IP
const changePasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.params?.id || ipKeyGenerator(req),
  handler: (req, res) => {
    const retryAfterSeconds = Math.ceil((req.rateLimit.resetTime?.getTime?.() - Date.now()) / 1000) || undefined;
    if (retryAfterSeconds) res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      message: 'Too many password change attempts. Please try again later.',
      retryAfterSeconds,
    });
  },
});

export { changePasswordLimiter };
