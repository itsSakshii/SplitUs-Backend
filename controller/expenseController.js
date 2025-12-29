const db = require('../db');

// record a new expense and split shares
const recordExpense = async (req, res) => {
    // Expense details from the client
    const { groupId, amount, description, date, shares } = req.body;
    
    // Payer ID is the logged-in user's ID, secured by middleware
    const paidBy = req.user.UserID; 

    let connection;

    // Basic Validation
    if (!groupId || !amount || !description || !date || !shares || shares.length === 0) {
        return res.status(400).json({ message: 'Missing required expense fields.' });
    }

    //  Verify total shares amount matches total expense amount
    const totalShareAmount = shares.reduce((sum, share) => sum + parseFloat(share.shareAmount), 0);
    if (Math.abs(totalShareAmount - amount) > 0.01) {
         // Note: Use a small tolerance for floating point numbers
         return res.status(400).json({ message: `Total shares (${totalShareAmount.toFixed(2)}) must equal the expense amount (${amount.toFixed(2)}).` });
    }

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Insert into Expenses Table (The parent record)
        const [expenseResult] = await connection.query(
            'INSERT INTO Expenses (GroupID, Amount, PaidBy, Date, Description) VALUES (?, ?, ?, ?, ?)',
            [groupId, amount, paidBy, date, description]
        );
        const newExpenseId = expenseResult.insertId;

        // 2. Insert into ExpenseShares Table (The dependent records)
        const sharePromises = shares.map(share => 
            connection.query(
                'INSERT INTO ExpenseShares (ExpenseID, UserID, ShareAmount) VALUES (?, ?, ?)',
                [newExpenseId, share.userId, share.shareAmount]
            )
        );
        await Promise.all(sharePromises);

        // 3. Commit the transaction
        await connection.commit();
        res.status(201).json({ 
            message: 'Expense recorded successfully', 
            expenseId: newExpenseId 
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error recording expense:', err);
        res.status(500).json({ message: 'Error recording expense.' });
    } finally {
        if (connection) connection.release();
    }
};
const getGroupExpenses = async (req, res) => {
    const { groupId } = req.params;

    try {
        const [expenses] = await db.query(`
            SELECT 
                E.ExpenseID, 
                E.Amount, 
                E.Date, 
                E.Description,
                U.Name AS PaidBy 
            FROM Expenses E
            JOIN Users U ON U.UserID = E.PaidBy
            WHERE E.GroupID = ?
            ORDER BY E.Date DESC
        `, [groupId]);

        // For each expense, fetch shares
        for (let exp of expenses) {
            const [shares] = await db.query(`
                SELECT 
                    ES.UserID,
                    ES.ShareAmount,
                    U.Name
                FROM ExpenseShares ES
                JOIN Users U ON ES.UserID = U.UserID
                WHERE ES.ExpenseID = ?
            `, [exp.ExpenseID]);

            exp.Shares = shares;   
        }

        res.json(expenses);

    } catch (err) {
        console.error("Error fetching expenses:", err);
        res.status(500).json({ message: "Error fetching expenses" });
    }
};


module.exports = {
    recordExpense,
    getGroupExpenses
    // ...
};