const auth = (req, res, next) => {
    // 1. Log the raw header to see what's coming in
    console.log('🔐 Checking Auth Header:', req.headers['authorization']);

    // 2. Extract token (removes "Bearer " if present)
    const authHeader = req.headers['authorization'];
    const token = authHeader ? authHeader.split(' ')[1] : null;

    if (!token) {
        console.log('❌ No token provided in header');
        return res.status(401).json({ error: 'Please authenticate' });
    }

    // 3. Simple Mock Verification (Matches your token format: petro_token_ID_timestamp)
    if (token.startsWith('petro_token_')) {
        const parts = token.split('_');
        // parts[0]="petro", parts[1]="token", parts[2]="ID", parts[3]="timestamp"
        const userId = parts[2]; 
        
        console.log('✅ Token Valid! User ID:', userId);
        
        // Attach user ID to request so controller can use it
        req.user = { id: userId };
        return next(); // Proceed to payment
    }

    console.log('❌ Invalid token format');
    return res.status(401).json({ error: 'Invalid token' });
};

module.exports = auth;