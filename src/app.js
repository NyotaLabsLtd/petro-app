require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ✅ Middleware
app.use(cors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Test Route
app.get('/', (req, res) => {
    res.json({ 
        message: '🔥 PETRO API is running!', 
        status: 'online', 
        timestamp: new Date().toISOString() 
    });
});

// ✅ Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payment')); // 🔑 THIS WAS MISSING
app.use('/api/upload', require('./routes/uploadRoutes'));

// ✅ 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n✅ PETRO API SERVER STARTED`);
    console.log(` Port: ${PORT}`);
    console.log(`🔗 Test: http://localhost:${PORT}\n`);
});

module.exports = app;