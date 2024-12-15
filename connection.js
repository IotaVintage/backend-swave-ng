const mysql = require('mysql');
require('dotenv').config();

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if(!err){
        console.log("Connected to the Database");
    } else {
        console.log(err);
    }
});

module.exports = connection;