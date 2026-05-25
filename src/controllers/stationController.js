const pool = require('../config/db');

// --- GET ALL STATIONS ---
exports.getStations = async (req, res) => {
  try {
    const stations = await pool.query('SELECT * FROM stations');
    res.json(stations.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// --- VALIDATE TILL NUMBER ---
exports.validateTill = async (req, res) => {
  try {
    const { till } = req.params;
    const station = await pool.query('SELECT * FROM stations WHERE till_number = $1', [till]);
    
    if (station.rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'Station not found' });
    }

    res.json({ valid: true, station: station.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};