// src/controllers/paymentController.js
const pool = require('../config/db');

// 1. Initiate M-Pesa STK Push
exports.initiatePayment = async (req, res) => {
    try {
        const { amount, stationTill, stationName } = req.body;
        const userId = req.user.id;
        const userPhone = req.user.phone;

        console.log(`💰 Payment Request: User=${userId}, Amount=${amount}, Station=${stationName}, Till=${stationTill}`);

        if (!amount || amount <= 0 || !stationTill) {
            return res.status(400).json({ error: 'Invalid payment details' });
        }

        // Generate unique request IDs
        const merchantRequestId = `merch_${Date.now()}`;
        const checkoutRequestId = `ws_${Date.now()}`;

        // Insert into database
        const result = await pool.query(
            `INSERT INTO transactions 
             (user_id, phone, amount, station_name, station_till, mpesa_checkout_request_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
             RETURNING *`,
            [userId, userPhone, amount, stationName, stationTill, checkoutRequestId]
        );

        console.log(`✅ Transaction saved to DB! ID: ${result.rows[0].id}`);

        // 🧪 TESTING ONLY: Auto-complete after 10 seconds (REMOVE when deploying to production!)
        setTimeout(async () => {
            try {
                await pool.query(
                    `UPDATE transactions 
                     SET status = 'Completed', mpesa_receipt = 'TEST${Date.now()}' 
                     WHERE id = $1`,
                    [result.rows[0].id]
                );
                console.log(`✅ Auto-completed transaction ${result.rows[0].id} (TESTING MODE)`);
            } catch (err) {
                console.error('❌ Auto-complete error:', err);
            }
        }, 10000); // 10 seconds delay

        res.json({
            message: 'STK Push sent successfully',
            transaction: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Database Error:', error.message);
        console.error(' Full Error:', error);
        res.status(500).json({ error: 'Failed to save transaction' });
    }
};

// 2. Handle M-Pesa Callback
exports.handleMpesaCallback = async (req, res) => {
    try {
        const callbackData = req.body.Body?.stkCallback;
        
        if (!callbackData) {
            console.log('⚠️ Invalid callback format');
            return res.json({ ResultCode: 0, ResultDesc: 'Success' });
        }

        const checkoutRequestId = callbackData.CheckoutRequestID;
        const resultCode = callbackData.ResultCode;

        console.log(`📥 M-Pesa Callback: Code=${resultCode}`);

        if (resultCode === 0) {
            // Success
            const metadata = callbackData.CallbackMetadata?.Item;
            const amount = metadata?.find(m => m.Name === 'Amount')?.Value;
            const mpesaReceipt = metadata?.find(m => m.Name === 'MpesaReceiptNumber')?.Value;

            await pool.query(
                `UPDATE transactions 
                 SET status = 'Completed', mpesa_receipt = $1
                 WHERE mpesa_checkout_request_id = $2`,
                [mpesaReceipt, checkoutRequestId]
            );

            console.log(`✅ Payment Completed: Receipt=${mpesaReceipt}`);
        } else {
            // Failed/Cancelled
            await pool.query(
                `UPDATE transactions SET status = 'Failed' WHERE mpesa_checkout_request_id = $1`,
                [checkoutRequestId]
            );
            console.log(`❌ Payment Failed`);
        }

        // Always respond with 200 to Safaricom
        res.json({ ResultCode: 0, ResultDesc: 'Success' });

    } catch (error) {
        console.error('❌ Callback Error:', error.message);
        res.status(200).json({ ResultCode: 1, ResultDesc: 'Error' });
    }
};

// 3. Get User Transaction History
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT id, amount, station_name, station_till, status, mpesa_receipt, created_at
             FROM transactions 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );
        res.json({ transactions: result.rows });
    } catch (error) {
        console.error('❌ Get History Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};