const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

// Route: GET /api/stations
// Get all registered stations
router.get('/', stationController.getStations);

// Route: GET /api/stations/validate/:till
// Validate a specific till number
router.get('/validate/:till', stationController.validateTill);

module.exports = router;