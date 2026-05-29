const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Generate unique referral code
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'PETRO-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Generate auth token
function generateToken(userId) {
    return `petro_token_${userId}_${Date.now()}`;
}

// ✅ REGISTER - Exported properly
exports.register = async (req, res) => {
    try {
        const { name, phone, pin, vehicle, vehicleType, profilePic, referredBy } = req.body;
        if (!name || !phone || !pin) {
            return res.status(400).json({ error: 'Please fill all required fields' });
        }
        const existingUser = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPin = await bcrypt.hash(pin, 10);
        const referralCode = generateReferralCode();
        const result = await pool.query(
            `INSERT INTO users (name, phone, pin, vehicle, vehicle_type, profile_pic, referral_code, referred_by, points) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING id, name, phone, vehicle, vehicle_type, profile_pic, referral_code, points, is_admin, created_at`,
            [name, phone, hashedPin, vehicle || null, vehicleType || null, profilePic || null, referralCode, referredBy || null, 50]
        );
        const newUser = result.rows[0];
        if (referredBy && !isNaN(parseInt(referredBy))) {
            try {
                await pool.query(`UPDATE users SET points = points + 100 WHERE id = $1`, [parseInt(referredBy)]);
                console.log(`✅ Referral: User ${referredBy} earned 100 points for referring ${newUser.id}`);
            } catch (err) { console.error('❌ Failed to add referral points:', err); }
        }
        const token = generateToken(newUser.id);
        res.status(201).json({ message: 'Account created successfully', user: newUser, token });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ LOGIN - Exported properly (FIXED: Added is_admin to SELECT)
exports.login = async (req, res) => {
    try {
        const { phone, pin } = req.body;
        if (!phone || !pin) {
            return res.status(400).json({ error: 'Please provide phone and PIN' });
        }
        const result = await pool.query(
            `SELECT id, name, phone, vehicle, vehicle_type, profile_pic, referral_code, points, pin, is_admin, created_at, updated_at 
             FROM users WHERE phone = $1`, [phone]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const isValidPin = await bcrypt.compare(pin, user.pin);
        if (!isValidPin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(user.id);
        delete user.pin;
        res.json({ message: 'Login successful', token, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ✅ GET PROFILE - Exported properly (Added is_admin)
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT id