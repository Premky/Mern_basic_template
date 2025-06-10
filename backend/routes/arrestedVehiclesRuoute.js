import express from 'express';
import con from '../utils/db.js';
import con2 from '../utils/db2.js';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import NepaliDate from 'nepali-datetime';

import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();
const query = promisify(con.query).bind(con);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import NepaliDateConverter from 'nepali-date-converter';
const current_date = new NepaliDate().format('YYYY-MM-DD');
const fy = new NepaliDate().format('YYYY'); //Support for filter
const fy_date = fy + '-04-01'
// console.log(current_date);
// console.log(fy_date)

//गाडीका विवरणहरुः नाम सुची
router.post('/add_vehicle', verifyToken, async (req, res) => {
    const active_office = req.userOffice;
    const user_id = req.userId;
    console.log(active_office, user_id)

    const {
        vehicle_np, vehicle_en
    } = req.body;

    const created_by = user_id; // Adjust this to dynamically handle creator if needed
    console.log(created_by)

    const sql = `INSERT INTO tango_vehicles (
        name_np, name_en
    ) VALUES (?)`;

    const values = [
        vehicle_np, vehicle_en
    ];

    try {
        const result = await query(sql, [values]);
        return res.json({ Status: true, Result: result });
    } catch (err) {
        console.error('Database error', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
});

router.get('/vehicles', async (req, res) => {
    const sql = `SELECT * FROM tango_vehicles`;
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" })
        return res.json({ Status: true, Result: result })
    })
})

router.put('/update_vehicle/:id', async (req, res) => {
    const id = req.params.id;
    const {
        vehicle_np, vehicle_en
    } = req.body;
    const updated_by = 1;
    const sql = `UPDATE tango_vehicles SET name_np=?, name_en=?  WHERE id=?`;
    const values = [
        vehicle_np, vehicle_en, id
    ];
    try {
        const result = await query(sql, values);
        return res.json({ Status: true, Result: result });
    } catch (err) {
        console.error('Database error', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
})

router.delete('/delete_vehicle/:id', async (req, res) => {
    const { id } = req.params;
    console.log(id)
    try {
        const sql = `DELETE FROM tango_vehicles WHERE id=?`;
        const result = await query(sql, id);
        return res.json({ Status: true, Result: 'Record Deleted Successfully!' });
    } catch (err) {
        console.error('Error Deleting Record:', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
})


//Rajashwa Sirshak hru
router.get('/rajashwa_data', async (req, res) => {
    const sql = `SELECT tp.*, tv.* 
            FROM tango_punishment_data tp
            LEFT JOIN tango_vehicles tv 
            ON tp.vehicle_id= tv.id
            ORDER BY tp.id desc
            `;
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" })
        return res.json({ Status: true, Result: result })
    })
})

router.post('/add_rajashwa', verifyToken, async (req, res) => {
    const active_office = req.user.office;
    const user_id = req.userId;
    // const active_office = 1;
    console.log(active_office)
    const {
        date, vehicle_id, count, fine,
    } = req.body;

    const created_by = user_id; // Adjust this to dynamically handle creator if needed
    console.log('created_by', created_by)

    const sql = `INSERT INTO tango_punishment_data (
        date, vehicle_id, count, fine, office_id, created_by
    ) VALUES (?)`;

    const values = [
        date, vehicle_id, count, fine, active_office, created_by,
    ];

    try {
        const result = await query(sql, [values]);
        return res.json({ Status: true, Result: result });
    } catch (err) {
        console.error('Database error', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
});

router.put('/update_rajashwa/:id', verifyToken, async (req, res) => {
    const active_office = req.userOffice;
    const id = req.params.id;
    const {
        vehicle_id, count, fine, date,
    } = req.body;
    const updated_by = active_office;
    console.log('updated_by', updated_by)
    const sql = `UPDATE tango_punishment_data SET vehicle_id=?, count=?, fine=?,date=?, updated_by=? WHERE id=?`;
    const values = [
        vehicle_id, count, fine, date, updated_by, id
    ];

    try {
        const result = await query(sql, values);
        return res.json({ Status: true, Result: result });
    } catch (err) {
        console.error('Database error', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
})

router.delete('/delete_rajashwa/:id', async (req, res) => {
    const { id } = req.params;
    console.log(id)
    try {
        const sql = `DELETE FROM tango_punishment_data WHERE id=?`;
        const result = await query(sql, id);
        return res.json({ Status: true, Result: 'Record Deleted Successfully!' });
    } catch (err) {
        console.error('Error Deleting Record:', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
})

//कसुरका विवरणहरुः नाम सुची
router.post('/add_kasur', async (req, res) => {
    const active_office = req.userOffice;
    const user_id = req.userId;

    const {
        name_np, name_en
    } = req.body;

    const created_by = user_id; // Adjust this to dynamically handle creator if needed
    console.log(created_by)

    const sql = `INSERT INTO tango_punishment (
        name_np, name_en
    ) VALUES (?)`;

    const values = [
        name_np, name_en
    ];

    try {
        const result = await query(sql, [values]);
        return res.json({ Status: true, Result: result });
    } catch (err) {
        console.error('Database error', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
});

router.put('/update_kasur/:id', async (req, res) => {
    const id = req.params.id;
    const {
        name_np, name_en
    } = req.body;
    const updated_by = 1;
    const sql = `UPDATE tango_punishment SET name_np=?, name_en=?  WHERE id=?`;
    const values = [
        name_np, name_en, id
    ];
    try {
        const result = await query(sql, values);
        return res.json({ Status: true, Result: result });
    } catch (err) {
        console.error('Database error', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
})

router.delete('/delete_kasur/:id', async (req, res) => {
    const { id } = req.params;
    console.log(id)
    try {
        const sql = `DELETE FROM tango_punishment WHERE id=?`;
        const result = await query(sql, id);
        return res.json({ Status: true, Result: 'Record Deleted Successfully!' });
    } catch (err) {
        console.error('Error Deleting Record:', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
})


//For Kasur
router.get('/kashurs', async (req, res) => {
    const sql = `SELECT * FROM tango_punishment_list`;
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" })
        return res.json({ Status: true, Result: result })
    })
})

router.get('/kasur_data', verifyToken, async (req, res) => {
    const active_office = req.user.office;
    // console.log('kasur_office', active_office)
    if (!active_office) {
        return res.json({ Status: false, Error: "Office ID is missing in token. Please relogin" });
    }
    const sql = `SELECT dk.*, tp.name_np AS kasur_np, tp.name_en AS kasur_en 
            FROM tango_daily_kasur dk
            LEFT JOIN tango_punishment_list tp 
            ON dk.kasur_id= tp.id
            WHERE office_id=?
            ORDER BY dk.id desc
            `;
    con.query(sql, [active_office], (err, result) => {
        if (err) {
            console.error('Error fetching kasur data:', err);
            return res.json({ Status: false, Error: "Query Error" })
        }
        return res.json({ Status: true, Result: result })
    })
})

router.post('/add_kasurs', verifyToken, async (req, res) => {
    const active_office = req.user.office;
    const user_id = req.user.username;

    const {
        date, kasur_id, count, fine
    } = req.body;

    const created_by = user_id; // Adjust this to dynamically handle creator if needed
    console.log(created_by)

    const sql = `INSERT INTO tango_daily_kasur (
        date, kasur_id, count, fine, office_id, created_by
    ) VALUES (?)`;

    const values = [
        date, kasur_id, count, fine, active_office, created_by,
    ];

    try {
        const result = await query(sql, [values]);
        return res.json({ Status: true, Result: result });
    } catch (err) {
        console.error('Database error', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
});

router.put('/update_kasurs/:id', verifyToken, async (req, res) => {
    const active_office = req.user.office;
    const id = req.params.id;
    const {
        kasur_id, count, fine, date
    } = req.body;
    const updated_by = req.user.username;
    const sql = `UPDATE tango_daily_kasur SET kasur_id=?,count=?, fine=?, date=?, updated_by=? WHERE id=?`;
    const values = [
        kasur_id, count, fine, date, updated_by, id
    ];

    try {
        const result = await query(sql, values);
        return res.json({ Status: true, Result: result });
    } catch (err) {
        console.error('Database error', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
})

router.delete('/delete_kasurs/:id', async (req, res) => {
    const { id } = req.params;
    // console.log(id)
    try {
        const sql = `DELETE FROM tango_daily_kasur WHERE id=?`;
        const result = await query(sql, id);
        return res.json({ Status: true, Result: 'Record Deleted Successfully!' });
    } catch (err) {
        console.error('Error Deleting Record:', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
})

router.get('/search_kasur', (req, res) => {
    const todaydate = currentDate
    // const todaydate='2081-07-08'
    const { date, type } = req.query; // Extract query parameters

    // Base SQL query with joins
    let sql = `
        SELECT dk.*, tp.*, o.* 
        FROM tango_daily_kasur dk 
        LEFT JOIN tango_punishment tp ON dk.kasur_id = tp.id 
        LEFT JOIN office o ON dk.office_id = o.o_id 
        WHERE 1=1
    `;
    const values = [];

    // Add conditions based on received parameters
    if (date) {
        sql += ' AND dk.date = ?';
        values.push(date);
    } else {
        sql += ' AND dk.date = ?';
        values.push(todaydate);
    }

    if (type) {
        sql += ' AND dk.punishment_id = ?'; // Adjust according to your schema
        values.push(type);
    }

    // Log the final query for debugging
    // console.log('Executing SQL:', sql);
    // console.log('With Params:', values);

    // Execute the query
    con.query(sql, values, (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ Status: false, Error: 'Database query failed.' });
        }

        if (results.length > 0) {
            return res.json({ Status: true, Result: results });
        } else {
            return res.json({ Status: false, Error: 'No records found.' });
        }
    });
});

router.get('/search_rajashwa', (req, res) => {
    const todaydate = currentDate
    // const todaydate='2081-07-15'
    const { date, type } = req.query; // Extract query parameters

    // Base SQL query with joins
    let sql = `
        SELECT dk.*, tp.*, o.* 
        FROM tango_punishment_data dk 
        LEFT JOIN tango_vehicles tp ON dk.vehicle_id = tp.id 
        LEFT JOIN office o ON dk.office_id = o.o_id 
        WHERE 1=1
    `;
    const values = [];

    // Add conditions based on received parameters
    if (date) {
        sql += ' AND dk.date = ?';
        values.push(date);
    } else {
        sql += ' AND dk.date = ?';
        values.push(todaydate);
    }

    if (type) {
        sql += ' AND dk.vehicle_id = ?'; // Adjust according to your schema
        values.push(type);
    }

    // Log the final query for debugging
    // console.log('Executing SQL:', sql);
    // console.log('With Params:', values);

    // Execute the query
    con.query(sql, values, (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ Status: false, Error: 'Database query failed.' });
        }

        if (results.length > 0) {
            return res.json({ Status: true, Result: results });
        } else {
            return res.json({ Status: false, Error: 'No records found.' });
        }
    });
});

router.post('/add_arrested_vehcile', verifyToken, async (req, res) => {
    const active_office = req.userOffice;
    const user_id = req.userId;

    const {
        date, rank_id, name, vehicle_no, kasur_id, owner, contact, voucher,
        return_date, return_name, return_address, return_contact, remarks
    } = req.body;

    const created_by = user_id; // Adjust this to dynamically handle creator if needed
    console.log(created_by)

    const sql = `INSERT INTO tango_arrest_vehicle (
        date, rank_id, name, vehicle_no, kasur_id, owner, contact, voucher,
        return_date, return_name, return_address, return_contact, remarks, office_id, created_by
    ) VALUES (?)`;

    const values = [
        date, rank_id, name, vehicle_no, kasur_id, owner, contact, voucher,
        return_date, return_name, return_address, return_contact, remarks, active_office, created_by
    ];

    try {
        const result = await query(sql, [values]);
        return res.json({ Status: true, Result: result });
    } catch (err) {
        console.error('Database error', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
});

router.get('/arrest_vehicle', verifyToken, async (req, res) => {
    const active_office = req.userOffice;
    // console.log('kasur_office', active_office)

    const sql = `SELECT tav.*, tp.*
                FROM tango_arrest_vehicle tav
                LEFT JOIN tango_punishment tp 
                ON tav.kasur_id = tp.id
                WHERE office_id=?                
                `;
    con.query(sql, active_office, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" })
        return res.json({ Status: true, Result: result })
    })
})

router.put('/update_arrest_vehicle/:id', verifyToken, async (req, res) => {
    const user_id = req.userId;
    const id = req.params.id;  //Received Via URL
    // console.log('id:',id, 'user',user_id)

    const {
        date, rank_id, name, vehicle_no, kasur_id, owner, contact, voucher,
        return_date, return_name, return_address, return_contact, remarks
    } = req.body;

    const sql = `UPDATE tango_arrest_vehicle 
        SET 
        date = ?, rank_id = ?, name = ?, vehicle_no = ?, 
        kasur_id = ?, owner = ?, contact = ?, voucher = ?, 
        return_date = ?, return_name = ?, return_address = ?, 
        return_contact = ?, remarks = ?, updated_by = ? 
    WHERE sn = ?`;

    const values = [
        date, rank_id, name, vehicle_no, kasur_id, owner, contact, voucher,
        return_date, return_name, return_address, return_contact, remarks,
        user_id, id
    ];

    try {
        const result = await query(sql, values);
        console.log(result)
        return res.json({ Status: true, Result: result });
    } catch (err) {
        console.error('Database error', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
})

router.delete('/delete_arrest_vehicle/:id', async (req, res) => {
    const { id } = req.params;
    console.log(id)
    try {
        const sql = `DELETE FROM tango_arrest_vehicle WHERE sn=?`;
        const result = await query(sql, id);
        return res.json({ Status: true, Result: 'Record Deleted Successfully!' });
    } catch (err) {
        console.error('Error Deleting Record:', err);
        return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
    }
})

router.get('/search_arrest_vehicle', verifyToken, async (req, res) => {
    const active_office = req.userOffice;
    const { srh_date, srh_voucher, srh_contact } = req.query;


    let sql = `SELECT tav.*, tp.*
                FROM tango_arrest_vehicle tav
                LEFT JOIN tango_punishment tp 
                ON tav.kasur_id = tp.id
                WHERE 1=1 AND office_id=?
                `;
    // WHERE office_id=?                
    const values = [active_office]

    //Add Conditions based on received parameters
    if (srh_date) {
        sql += ` AND tav.date = ?`;
        values.push(srh_date);
    }
    // else {
    //     sql += ` AND tav.date = ?`;
    //     values.push(todaydate);
    // }
    if (srh_voucher) {
        sql += ` AND tav.voucher = ?`;
        values.push(srh_voucher);
    }
    if (srh_contact) {
        sql += ` AND tav.contact = ?`;
        values.push(srh_contact);
    }

    // console.log(sql)

    con.query(sql, values, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" })
        return res.json({ Status: true, Result: result })
    })
})

//Fetch Individual User
router.get('/users', verifyToken, (req, res) => {
    const active_branch = req.userBranch;
    // console.log('bid', active_branch)
    const sql =
        `SELECT u.*, ut.ut_name AS usertype, o.office_name AS office_name, b.branch_name, o.o_id as office_id
        FROM users u
        JOIN usertypes ut ON u.usertype = ut.utid
        INNER JOIN office o ON u.office_id = o.o_id
        INNER JOIN branch b ON u.branch_id = b.bid
        WHERE branch_id = ?
        `;
    // INNER JOIN office_branch ob ON u.branch=ob.bid
    con.query(sql, active_branch, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" })
        return res.json({ Status: true, Result: result })
    })
})

export { router as arrestedVehicleRouter }