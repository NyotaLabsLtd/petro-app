const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const stationRoutes = require('./routes/station');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes'); // ✅ NEW LINE

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ SECURITY: Helmet (sets secure HTTP headers automatically)
app.use(helmet());

// ✅ SECURITY: Rate Limiting (prevents spam/abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// ✅ SECURITY: CORS (only allow your Netlify site + localhost for testing)
app.use(cors({
  origin: ['https://creative-liger-972fd0.netlify.app', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes); // ✅ NEW LINE

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'PETRO API is running!', status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(PORT, () => {
  console.log(`🚀 PETRO API running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  db.connect()
    .then(() => console.log('✅ Database connected'))
    .catch(err => console.error('❌ DB connection failed:', err.message));
});

module.exports = app;