const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { handleScan } = require('../controllers/scanController');

const router = Router();

// Global IP-based rate limiter (extra layer on top of per-user cooldown)
const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', scanLimiter, handleScan);

module.exports = router;
