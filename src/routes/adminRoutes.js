const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    const { rows } = await db.query(
      'SELECT * FROM users WHERE id = $1 AND is_admin = true',
      [decoded.userId]
    );
    
    if (rows.length === 0) return res.status(403).json({ error: 'Admin access required' });
    
    req.user = rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET: All stations
router.get('/stations', adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM stations ORDER BY added_by_admin_at DESC'
    );
    res.json({ stations: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add new station (manual onboarding)
router.post('/stations', adminAuth, async (req, res) => {
  try {
    const { name, till_number, location, contact_person, contact_phone, admin_notes } = req.body;
    
    const { rows } = await db.query(
      `INSERT INTO stations (name, till_number, location, contact_person, contact_phone, admin_notes, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, true) 
       RETURNING *`,
      [name, till_number, location, contact_person, contact_phone, admin_notes]
    );
    
    res.json({ message: 'Station added successfully', station: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update station
router.put('/stations/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, till_number, location, contact_person, contact_phone, admin_notes, is_active } = req.body;
    
    const { rows } = await db.query(
      `UPDATE stations 
       SET name = $1, till_number = $2, location = $3, contact_person = $4, 
           contact_phone = $5, admin_notes = $6, is_active = $7
       WHERE id = $8
       RETURNING *`,
      [name, till_number, location, contact_person, contact_phone, admin_notes, is_active, id]
    );
    
    res.json({ message: 'Station updated successfully', station: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove station
router.delete('/stations/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM stations WHERE id = $1', [id]);
    res.json({ message: 'Station deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: All transactions (for monitoring)
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM transactions ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ transactions: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Dashboard analytics
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const totalUsers = await db.query('SELECT COUNT(*) FROM users WHERE is_admin = false');
    const totalStations = await db.query('SELECT COUNT(*) FROM stations WHERE is_active = true');
    const totalTransactions = await db.query('SELECT COUNT(*) FROM transactions WHERE status = $1', ['Completed']);
    const totalRevenue = await db.query('SELECT SUM(amount) FROM transactions WHERE status = $1', ['Completed']);
    
    res.json({
      analytics: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalStations: parseInt(totalStations.rows[0].count),
        totalTransactions: parseInt(totalTransactions.rows[0].count),
        totalRevenue: parseFloat(totalRevenue.rows[0].sum || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: All users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, phone, vehicle, vehicle_type, points, created_at FROM users WHERE is_admin = false ORDER BY created_at DESC'
    );
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;