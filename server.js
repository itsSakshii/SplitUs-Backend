const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
 const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');
 const settlementRoutes = require('./routes/settlements');
 const userRoutes = require('./routes/user');
// Use routes
app.use('/api/auth', authRoutes);
console.log('Middleware applied');
 app.use('/api/groups', groupRoutes);
 app.use('/api/expenses', expenseRoutes);
 app.use('/api/settlements', settlementRoutes);
 app.use('/api/users', userRoutes);
// Default route
app.get('/', (req, res) => res.send('Split Expenses Tracker API running ✅'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;