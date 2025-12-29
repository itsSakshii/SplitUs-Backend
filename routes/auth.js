const { authenticateToken } = require('../middleware/auth');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Check for existing user
        const [existing] = await pool.query('SELECT * FROM Users WHERE Email = ?', [email]);
        if (existing.length) return res.status(400).json({ message: 'Email already exists' });

        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO Users (Name, Email, Password) VALUES (?, ?, ?)', [name, email, hash]);
        
        // Payload for the token and response (DO NOT include the password/hash)
        const payload = { UserID: result.insertId, Name: name, Email: email };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Added expiry
        res.json({ token, user: payload }); // Send back token and user info
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query('SELECT * FROM Users WHERE Email = ?', [email]);
        
        // 400 Bad Request if user not found
        if (!users.length) return res.status(400).json({ message: 'Invalid email or password' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.Password);
        
        // 400 Bad Request if password doesn't match
        if (!match) return res.status(400).json({ message: 'Invalid email or password' });

        // Safely extract data for the payload (excluding Password)
        const { UserID, Name, Email } = user;
        const payload = { UserID, Name, Email };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Added expiry
        res.json({ token, user: payload }); // Send back token and user info
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});



router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const { UserID } = req.user;
 
        const [rows] = await pool.query(
            'SELECT UserID, Name, Email FROM Users WHERE UserID = ?',
            [UserID]
        );
 
        if (!rows.length) {
            return res.status(404).json({ message: 'User not found' });
        }
 
        res.json({ user: rows[0] });
    } catch (err) {
        console.error('Profile Error:', err);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});
module.exports = router;

