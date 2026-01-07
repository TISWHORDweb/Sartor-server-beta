const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        status: false,
        message: 'Too many requests from this IP, please try again later.',
        data: null
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.path === '/health' || req.path.startsWith('/docs');
    }
});

exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        status: false,
        message: 'Too many login attempts, please try again after 15 minutes.',
        data: null
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

exports.helmetSecurity = helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: 'sameorigin' }
});

exports.mongoSanitize = mongoSanitize({
    replaceWith: '_',
    onSanitize: () => {}
});

exports.xssProtection = xss();

exports.hppProtection = hpp({
    whitelist: [
        'page', 'limit', 'search', 'status', 'sort', 
        'product', 'customer', 'user', 'admin', 'id',
        'email', 'phone', 'name', 'type', 'role'
    ]
});

exports.requestSizeLimit = (req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        return next();
    }
    next();
};

exports.requestTimeout = (timeout = 30000) => {
    return (req, res, next) => {
        const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
        const isLongVerify = req.path && req.path.includes('/label/verify');
        const extendedTimeout = (isMultipart || isLongVerify) ? Math.max(timeout, 180000) : timeout;

        req.setTimeout(extendedTimeout, () => {
            if (!res.headersSent) {
                res.status(408).json({
                    status: false,
                    message: 'Request timeout. Please try again.',
                    data: null
                });
            }
        });
        next();
    };
};

exports.customSecurityHeaders = (req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
};

exports.validateIP = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (ip && !ipv4Regex.test(ip) && !ipv6Regex.test(ip) && ip !== '::1' && ip !== '127.0.0.1') {
        if (process.env.NODE_ENV === 'production') {
            console.warn(`Suspicious IP format: ${ip}`);
        }
    }
    next();
};

exports.sanitizeInput = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            
            if (key.startsWith('$')) {
                continue;
            }
            
            if (typeof value === 'string') {
                sanitized[key] = value.replace(/\0/g, '').trim();
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = exports.sanitizeInput(value);
            } else {
                sanitized[key] = value;
            }
        }
    }
    
    return sanitized;
};

