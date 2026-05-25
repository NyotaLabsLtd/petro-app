// src/controllers/otpController.js

// Temporary storage for OTPs (In production, use Redis or Database)
const otpStore = new Map();

// 1. Generate and Send OTP
exports.sendOtp = (req, res) => {
    const { phone } = req.body;
    
    if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
    }

    // Generate random 6-digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 5-minute expiry
    otpStore.set(phone, {
        code: otp,
        expires: Date.now() + (5 * 60 * 1000)
    });

    // 🔥 MOCK MODE: Log to console instead of sending SMS
    console.log(`\n\n ==================================== `);
    console.log(` 📱 OTP SENT TO ${phone}: ${otp} `);
    console.log(` ==================================== \n`);

    res.json({ message: "OTP sent successfully (Check Console)" });
};

// 2. Verify OTP
exports.verifyOtp = (req, res) => {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
        return res.status(400).json({ error: "Phone and Code are required" });
    }

    const stored = otpStore.get(phone);

    if (!stored) {
        return res.status(400).json({ error: "No OTP requested for this number" });
    }

    if (Date.now() > stored.expires) {
        otpStore.delete(phone);
        return res.status(400).json({ error: "OTP has expired" });
    }

    if (stored.code !== code) {
        return res.status(400).json({ error: "Invalid OTP code" });
    }

    // Success
    otpStore.delete(phone);
    res.json({ message: "Phone verified successfully" });
};