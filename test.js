const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'S1605mypersonal',
  database: 'split_expenses'
});

connection.connect((err) => {
  if (err) {
    console.error('Connection failed:', err.message);
  } else {
    console.log('Connected to MySQL database!');
  }
  connection.end();
});




