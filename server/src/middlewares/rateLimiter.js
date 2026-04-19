import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 400, 
  message: { 
    error: 'Too many requests from this IP, please try again after 15 minutes.' 
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});


export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { 
    error: 'Too many checkout attempts. Please try again later.' 
  },
});