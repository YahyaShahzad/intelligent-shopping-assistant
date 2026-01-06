const rateLimit = require('express-rate-limit');

// Rate limiting middleware for production
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Effectively unlimited for development
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    skip: (req) => req.method === 'GET', // Don't limit GET requests
    message: 'Too many requests from this IP, please try again later',
});

const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many search requests, please try again later',
});

module.exports = {
    loginLimiter,
    apiLimiter,
    searchLimiter
};
