// backend/routes/settlements.js (Update)

const express = require('express');
const { getNetBalance, recordSettlement } = require('../controller/settlementController');
const { authenticateToken } = require('../middleware/auth'); // Assuming you import auth here
const router = express.Router();

//CHANGE 2: Apply middleware and remove :userId parameter
router.get('/balance', authenticateToken, getNetBalance); 

router.post('/', authenticateToken, recordSettlement); // Applied protection here too

module.exports = router;