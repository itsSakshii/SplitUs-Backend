const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const { createGroup, getGroupsByUserId, getGroupMembers, addMember } = require('../controller/groupController');
const router = express.Router();

// Create a group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { groupName } = req.body;
    const userId = req.user.UserID;
    const [result] = await pool.query('INSERT INTO GroupsTable (GroupName, CreatedBy) VALUES (?, ?)', [groupName, userId]);
    await pool.query('INSERT INTO GroupMembers (GroupID, UserID) VALUES (?, ?)', [result.insertId, userId]);
    res.json({ message: 'Group created', groupId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating group' });
  }
});

// List all groups of a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.UserID;
    const [groups] = await pool.query(`
      SELECT g.GroupID, g.GroupName, g.CreatedBy,u.Name AS CreatorName
      FROM GroupsTable g
      JOIN GroupMembers gm ON gm.GroupID = g.GroupID
      JOIN Users u ON g.CreatedBy = u.UserID 
             WHERE gm.UserID = ?`, [userId]);
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching groups' });
  }
});
router.get('/members/:groupId', authenticateToken, getGroupMembers);
router.post('/members', authenticateToken, addMember);
module.exports = router;
