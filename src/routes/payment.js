const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// ✅ CRITICAL: Import verifyToken DIRECTLY. Do NOT use { }
const verifyToken = require('../middleware/auth');

// 1. Initiate Payment
router.post('/initiate', verifyToken, paymentController.initiatePayment);

// 2. Callback from Safaricom
router.post('/callback', paymentController.handleMpesaCallback);

// 3. Get History
router.get('/history', verifyToken, paymentController.getHistory);

module.exports = router;