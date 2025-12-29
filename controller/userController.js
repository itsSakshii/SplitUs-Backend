const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Function to fetch a list of all registered users (excluding the password)
const getAllUsers = async (req, res) => {
    try {
        // Retrieve UserID, Name, and Email for the members list dropdown
        const [users] = await db.query(
            'SELECT UserID, Name, Email FROM Users ORDER BY Name ASC'
        );
        res.json(users);
    } catch (err) {
        console.error('Error fetching all users:', err);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

module.exports = {
    getAllUsers,
};

