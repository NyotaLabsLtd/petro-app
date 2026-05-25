const axios = require('axios');
const base64 = require('base-64');

// Get credentials from .env
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

// 1. Get Access Token
exports.getAccessToken = async () => {
    try {
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
        
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            }
        );
        
        console.log('✅ M-Pesa Access Token obtained');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ M-Pesa Token Error:', error.message);
        throw new Error('Failed to get M-Pesa access token');
    }
};

// 2. STK Push (Lipa Na M-Pesa Online)
exports.stkPush = async (phone, amount, till, description) => {
    try {
        const accessToken = await this.getAccessToken();
        
        // Format phone number (remove 0, add 254)
        const formattedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone;
        
        // Generate timestamp and password
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
        
        const stkPayload = {
            BusinessShortCode: SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: SHORTCODE,
            PhoneNumber: formattedPhone,
            CallBackURL: CALLBACK_URL,
            AccountReference: till || 'FUELPAY',
            TransactionDesc: description || 'Fuel Payment'
        };
        
        console.log('📱 Sending STK Push to:', formattedPhone, 'Amount:', amount);
        
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            stkPayload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ STK Push Response:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ STK Push Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.errorMessage || 'STK Push failed');
    }
};