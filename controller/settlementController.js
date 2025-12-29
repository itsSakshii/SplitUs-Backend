const db = require('../db');

// Get Net Balance for a User (Core Query 3.iii)
const getNetBalance = async (req, res) => {
    const { userId } = req.user.UserID;

    try {
        // calculate net balance: (Total Paid by User) - (Total Share Owed by User)
        const [result] = await db.query(`
            SELECT
                (
                    SELECT COALESCE(SUM(Amount), 0)
                    FROM Expenses
                    WHERE PaidBy = ?
                ) - 
                (
                    SELECT COALESCE(SUM(ShareAmount), 0)
                    FROM ExpenseShares
                    WHERE UserID = ?
                ) AS NetBalance;
        `, [userId, userId]);

        const netBalance = result[0].NetBalance;
        res.json({ userId: parseInt(userId), netBalance: parseFloat(netBalance) });
    } catch (err) {
        console.error('Error fetching net balance:', err);
        res.status(500).json({ message: 'Error calculating net balance' });
    }
};



// Record a Settlement
const recordSettlement = async (req, res) => {
    // 1. Get the current user's ID (the payer) from the JWT payload
    // The 'authenticateToken' middleware should set req.user.UserID
    const fromUser = req.user.UserID; 
    
    // 2. Extract the remaining settlement data from the request body
    const { toUser, amount, groupId, date } = req.body; 
    
    // Simple validation 
    if (!fromUser || !toUser || !amount || !date) {
         return res.status(400).json({ message: 'Missing required settlement fields' });
    }

    try {
        // Use the 'fromUser' extracted from the token (req.user.UserID)
        await db.query(
            'INSERT INTO Settlements (FromUser, ToUser, Amount, GroupID, Date) VALUES (?, ?, ?, ?, ?)',
            [fromUser, toUser, amount, groupId, date] 
        );
        res.status(201).json({ message: 'Settlement recorded successfully' });
    } catch (err) {
      
        console.error('Error recording settlement:', err); 
        res.status(500).json({ message: 'Error recording settlement' });
    }
};



module.exports = {
    getNetBalance,
    recordSettlement
};