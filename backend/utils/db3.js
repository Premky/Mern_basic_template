import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();


const pool = mysql.createPool({
    host: process.env.DB_HOST2,
    ...(process.env.DB_PORT2 && { port: process.env.DB_PORT2 }),
    user: process.env.DB_USER2,
    password: process.env.DB_PASSWORD2,
    database: process.env.DB_NAME2,

    ...(process.env.SSL && {
        ssl: {
            rejectUnauthorized: false,
        }
    }),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.connect(function (err) {
    if (err) {
        console.log("Connection Error", err.message);
    } else {
        console.log("Connected:2")
    }
})

export default pool;