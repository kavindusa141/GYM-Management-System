const rateLimit = require('express-rate-limit');

// 1. Global Limiter (Generous limit to prevent basic DDoS and spamming)
exports.globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
    message: {
        message: "Too many requests from this IP, please try again after 15 minutes.",
        status: 429
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 2. Auth Limiter (Strict limit specifically for login, register, forgot password endpoints)
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per `window` to stop brute-forcing passwords
    message: {
        message: "Too many login attempts from this IP, please try again after 15 minutes.",
        status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
});
