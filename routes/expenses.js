// backend/routes/expenses.js

const express = require('express');
const { recordExpense, getGroupExpenses } = require('../controller/expenseController');
const { authenticateToken } = require('../middleware/auth'); // Import middleware
const router = express.Router();

// Route to record a new expense and split shares
router.post('/', authenticateToken, recordExpense); // Protected route

// Route to get all expenses for a specific group
router.get('/:groupId', authenticateToken, getGroupExpenses); // Protected route

module.exports = router;