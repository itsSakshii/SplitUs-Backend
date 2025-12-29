const db = require('../db');

// Get all groups for a user
const getGroupsByUserId = async (req, res) => {
    const { userId } = req.user.UserID;
    try {
        const [groups] = await db.query(`
            SELECT 
                G.GroupID, G.GroupName, U.Name AS CreatedBy
            FROM 
                GroupsTable G
            JOIN 
                GroupMembers GM ON G.GroupID = GM.GroupID
            JOIN
                Users U ON G.CreatedBy = U.UserID
            WHERE 
                GM.UserID = ?
            ORDER BY G.CreatedAt DESC
        `, [userId]);
        res.json(groups);
    } catch (err) {
        console.error('Error fetching groups:', err);
        res.status(500).json({ message: 'Error fetching groups' });
    }
};

// Create a new group (using transaction)
const createGroup = async (req, res) => {
    const { groupName} = req.body;
    //  Get createdByUserId from the middleware payload
    const createdByUserId = req.user.UserID; 
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Insert into GroupsTable
        const [groupResult] = await connection.query(
            'INSERT INTO GroupsTable (GroupName, CreatedBy) VALUES (?, ?)',
            [groupName, createdByUserId]
        );
        const newGroupId = groupResult.insertId;

        // 2. Insert creator into GroupMembers
        await connection.query(
            'INSERT INTO GroupMembers (GroupID, UserID) VALUES (?, ?)',
            [newGroupId, createdByUserId]
        );

        await connection.commit();
        res.status(201).json({ 
            message: 'Group created successfully', 
            groupId: newGroupId 
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error creating group:', err);
        res.status(500).json({ message: 'Error creating group' });
    } finally {
        if (connection) connection.release();
    }
};

// Get members of a specific group 
const getGroupMembers = async (req, res) => {
    const { groupId } = req.params;
    try {
        const [members] = await db.query(`
            SELECT U.UserID, U.Name, U.Email
            FROM Users U
            JOIN GroupMembers GM ON U.UserID = GM.UserID
            WHERE GM.GroupID = ?
        `, [groupId]);
        res.json(members);
    } catch (err) {
        console.error('Error fetching group members:', err);
        res.status(500).json({ message: 'Error fetching group members' });
    }
}
// backend/controllers/groupController.js (Add addMember function)



// Function to add an existing user to a group
const addMember = async (req, res) => {
    
    const { groupId, userIdToAdd } = req.body;
    
    try {
        // 1. Check if the user is already a member 
        const [existing] = await db.query(
            'SELECT * FROM GroupMembers WHERE GroupID = ? AND UserID = ?',
            [groupId, userIdToAdd]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'User is already a member of this group.' });
        }

        // 2. Insert into GroupMembers
        await db.query(
            'INSERT INTO GroupMembers (GroupID, UserID) VALUES (?, ?)',
            [groupId, userIdToAdd]
        );

        res.status(200).json({ message: 'Member added successfully' });

    } catch (err) {
        console.error('Error adding member to group:', err);
        res.status(500).json({ message: 'Error adding member' });
    }
};


module.exports = {
    getGroupsByUserId,
    createGroup,
    getGroupMembers,
        addMember
};