import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const con = mysql.createConnection({
    host: process.env.DB_HOST,
    ...(process.env.DB_PORT && { port: process.env.DB_PORT }),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ...(process.env.SSL && {
        ssl: {
            rejectUnauthorized: false,
        }
    })
})
console.log('env check', process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASSWORD)

con.connect(function(err){
    if(err){
        console.error("Connection Error:", err.message);
    }else{
        console.log("Connected")
    }
})

export default con;