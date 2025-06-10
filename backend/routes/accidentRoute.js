import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import { promisify } from 'util';
import verifyToken from '../middlewares/verifyToken.js';
import con from '../utils/db.js';

dotenv.config();

// Promisify specific methods
const queryAsync = promisify(con.query).bind(con);
const beginTransactionAsync = promisify(con.beginTransaction).bind(con);
const commitAsync = promisify(con.commit).bind(con);
const rollbackAsync = promisify(con.rollback).bind(con);
const query = promisify(con.query).bind(con);

const router = express.Router();

router.post("/create_accident", verifyToken, async (req, res) => {
    const { username, office_id } = req.user;

    const {
        date, state_id, district_id, municipality_id, ward, road_name,
        accident_location, accident_time, death_male, death_female, death_boy, death_girl, death_other,
        gambhir_male, gambhir_female, gambhir_boy, gambhir_girl, gambhir_other,
        general_male, general_female, general_boy, general_girl, general_other,
        animal_death, animal_injured, est_amount, damage_vehicle, txt_accident_reason, remarks
    } = req.body;

    const accidentRecord = [
        date, state_id, district_id, municipality_id, ward, road_name,
        accident_location, accident_time, death_male, death_female, death_boy, death_girl, death_other,
        gambhir_male, gambhir_female, gambhir_boy, gambhir_girl, gambhir_other,
        general_male, general_female, general_boy, general_girl, general_other,
        animal_death, animal_injured, est_amount, damage_vehicle, txt_accident_reason, remarks, office_id, username
    ];

    try {
        await beginTransactionAsync();

        // 1. Insert into accident_records
        const insertAccidentSQL = `
            INSERT INTO accident_records (
                date, state_id, district_id, municipality_id, ward, road_name,
                accident_location, accident_time, death_male, death_female, death_boy, death_girl, death_other,
                gambhir_male, gambhir_female, gambhir_boy, gambhir_girl, gambhir_other,
                general_male, general_female, general_boy, general_girl, general_other,
                animal_death, animal_injured, est_amount, damage_vehicle, txt_accident_reason, remarks, office_id, created_by
            ) VALUES (?)`;

        const accidentResult = await queryAsync(insertAccidentSQL, [accidentRecord]);
        const accident_id = accidentResult.insertId;

        // 2. Insert accident reasons
        const reasonEntries = Object.entries(req.body).filter(([key]) =>
            key.startsWith("accident_type_")
        );

        // console.log("Filtered Entries:", reasonEntries);

        if (reasonEntries.length === 0) {
            console.log("No matching accident types found.");
        } else {
            for (const [key, reason_id] of reasonEntries) {
                const accident_type_id = parseInt(key.split('_')[2], 10);
                const insertReasonSQL = `
                    INSERT INTO accident_record_reasons (
                        accident_id, accident_type_id, accident_reason_id
                    ) VALUES (?, ?, ?)`;
                await queryAsync(insertReasonSQL, [accident_id, accident_type_id, reason_id]);
            }
        }

        // 3. Insert involved vehicles
        const vehicleEntries = Object.entries(req.body).filter(([key]) =>
            key.startsWith("vehicle_name_")
        );

        for (const [key, vehicle_id] of vehicleEntries) {
            const vehicleIndex = key.split('_')[2];
            const categoryKey = `vehicle_category_${vehicleIndex}`;
            const vehicle_category = req.body[categoryKey] || "";
            const countryKey = `vehicle_country_${vehicleIndex}`;
            const vehicle_country = req.body[countryKey] || "";
            const remarkKey = `vehicle_remark_${vehicleIndex}`;
            const vehicle_remark = req.body[remarkKey] || "";

            const insertVehicleSQL = `
                INSERT INTO accident_vehicles (
                    accident_id, vehicle_id, category_id, country_id, vehicle_role
                ) VALUES (?, ?, ?,?, ?)`;
            await queryAsync(insertVehicleSQL, [accident_id, vehicle_id, vehicle_category, vehicle_country, vehicle_remark]);
        }

        await commitAsync(); // Commit the transaction

        return res.json({
            Status: true,
            message: "दुर्घटना विवरण सफलतापूर्वक सुरक्षित गरियो।"
        });

    } catch (error) {
        await rollbackAsync(); // Rollback the transaction if error occurs

        console.error("Transaction failed:", error);
        return res.status(500).json({
            Status: false,
            Error: error.message,
            message: "सर्भर त्रुटि भयो, सबै डाटा पूर्वस्थितिमा फर्काइयो।"
        });
    }
});

router.get("/get_accident_records2", verifyToken, async (req, res) => {
    const { username, office_id, role_en } = req.user;
    console.log("User:", username, "Office ID:", office_id, "Role:", role_en);

    try {
        // Base query
        let queryStr = `
            SELECT 
              ar.date,
              c.name_np AS municipality,
              d.name_np AS district,
              s.name_np AS state,
              ar.ward,
              ar.road_name,
              ar.accident_location,
              ar.accident_time,

              ar.death_male, ar.death_female, ar.death_boy, ar.death_girl, ar.death_other,
              (ar.death_male + ar.death_female + ar.death_boy + ar.death_girl + ar.death_other) AS total_death,

              ar.gambhir_male, ar.gambhir_female, ar.gambhir_boy, ar.gambhir_girl, ar.gambhir_other,
              (ar.gambhir_male + ar.gambhir_female + ar.gambhir_boy + ar.gambhir_girl + ar.gambhir_other) AS total_gambhir,

              ar.general_male, ar.general_female, ar.general_boy, ar.general_girl, ar.general_other,
              (ar.general_male + ar.general_female + ar.general_boy + ar.general_girl + ar.general_other) AS total_general,

              ar.animal_death, ar.animal_injured,
              ar.est_amount, ar.damage_vehicle, ar.txt_accident_reason,
              ar.remarks,
              ar.office_id, ar.created_by, ar.updated_by,

              CONCAT(c.name_np, ', ', d.name_np, ', ', s.name_np) AS location,
              GROUP_CONCAT(DISTINCT art.name_np SEPARATOR ', ') AS accident_types,
              GROUP_CONCAT(DISTINCT arsn.name_np SEPARATOR ', ') AS accident_reasons,
              GROUP_CONCAT(DISTINCT v.name_np SEPARATOR ', ') AS vehicle_names

            FROM accident_records ar
                LEFT JOIN accident_record_reasons arr ON arr.accident_id = ar.id
                LEFT JOIN accident_reasons arsn ON arsn.id = arr.accident_reason_id
                LEFT JOIN accident_reason_type art ON art.id = arsn.reason_type
                LEFT JOIN accident_vehicles av ON av.accident_id = ar.id
                LEFT JOIN vehicles v ON v.id = av.vehicle_id
            JOIN np_municipalities c ON c.id = ar.municipality_id
            JOIN np_districts d ON d.id = ar.district_id
            JOIN np_states s ON s.id = ar.state_id
        `;

        // Add condition if not superuser
        if (role_en !== "Superuser") {
            queryStr += ` WHERE ar.office_id = ?`;
        }

        queryStr += ` GROUP BY ar.id ORDER BY ar.date DESC`;

        // Run query with appropriate values
        const records = role_en === "Superuser"
            ? await query(queryStr)
            : await query(queryStr, [office_id]);

        // Get vehicles and accident types/reasons
        const vehicles = await query(`SELECT name_np FROM vehicles`);
        const typesAndReasons = await query(`
            SELECT art.name_np AS accident_type, arsn.name_np AS accident_reason
            FROM accident_reason_type art
            JOIN accident_reasons arsn ON arsn.reason_type = art.id
        `);

        res.json({
            Status: true,
            message: "Records fetched successfully.",
            records,
            vehicles: vehicles.map(v => v.name_np),
            typesAndReasons,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

router.get("/get_accident_records", verifyToken, async (req, res) => {
    const { username, office_id, role_en } = req.user;
    console.log("User:", username, "Office ID:", office_id, "Role:", role_en);
    try {
        // Main data
        //   ar.date,
        //   ar.accident_time,  
        let sql1 = `
                SELECT 
                ar.date,
                c.name_np AS municipality,
                d.name_np AS district,
                s.name_np AS state,
                ar.ward,
                ar.road_name,
                ar.accident_location,
                ar.accident_time,

                ar.death_male,
                ar.death_female,
                ar.death_boy,
                ar.death_girl,
                ar.death_other,
                (ar.death_male + ar.death_female + ar.death_boy + ar.death_girl + ar.death_other) AS total_death,

                ar.gambhir_male,
                ar.gambhir_female,
                ar.gambhir_boy,
                ar.gambhir_girl,
                ar.gambhir_other,
                (ar.gambhir_male + ar.gambhir_female + ar.gambhir_boy + ar.gambhir_girl + ar.gambhir_other) AS total_gambhir,

                ar.general_male,
                ar.general_female,
                ar.general_boy,
                ar.general_girl,
                ar.general_other,
                (ar.general_male + ar.general_female + ar.general_boy + ar.general_girl + ar.general_other) AS total_general,

                ar.animal_death,
                ar.animal_injured,
                ar.est_amount,
                ar.damage_vehicle,
                ar.txt_accident_reason,
                ar.remarks,

                ar.office_id,
                ar.created_by,
                ar.updated_by,

                CONCAT(c.name_np, ', ', d.name_np, ', ', s.name_np) AS location,
                art.name_np AS accident_type,
                arsn.name_np AS accident_reason,
                v.name_np AS vehicle_name,

                COUNT(*) AS count

            FROM accident_records ar

            JOIN accident_record_reasons arr ON arr.accident_id = ar.id
            JOIN accident_reasons arsn ON arsn.id = arr.accident_reason_id
            JOIN accident_reason_type art ON art.id = arsn.reason_type
            JOIN accident_vehicles av ON av.accident_id = ar.id
            JOIN vehicles v ON v.id = av.vehicle_id
            JOIN np_municipalities c ON c.id = ar.municipality_id
            JOIN np_districts d ON d.id = ar.district_id
            JOIN np_states s ON s.id = ar.state_id

            GROUP BY 
                ar.date,
                ar.accident_time,
                c.name_np,
                d.name_np,
                s.name_np,
                ar.ward,
                ar.road_name,
                ar.accident_location,

                ar.death_male,
                ar.death_female,
                ar.death_boy,
                ar.death_girl,
                ar.death_other,

                ar.gambhir_male,
                ar.gambhir_female,
                ar.gambhir_boy,
                ar.gambhir_girl,
                ar.gambhir_other,

                ar.general_male,
                ar.general_female,
                ar.general_boy,
                ar.general_girl,
                ar.general_other,

                ar.animal_death,
                ar.animal_injured,
                ar.est_amount,
                ar.damage_vehicle,
                ar.txt_accident_reason,
                ar.remarks,

                ar.office_id,
                ar.created_by,
                ar.updated_by,

                art.name_np,
                arsn.name_np,
                v.name_np

            ORDER BY ar.date DESC
            `      
            let sql2 = `
                SELECT 
                ar.date,
                c.name_np AS municipality,
                d.name_np AS district,
                s.name_np AS state,
                ar.ward,
                ar.road_name,
                ar.accident_location,
                ar.accident_time,

                ar.death_male,
                ar.death_female,
                ar.death_boy,
                ar.death_girl,
                ar.death_other,
                (ar.death_male + ar.death_female + ar.death_boy + ar.death_girl + ar.death_other) AS total_death,

                ar.gambhir_male,
                ar.gambhir_female,
                ar.gambhir_boy,
                ar.gambhir_girl,
                ar.gambhir_other,
                (ar.gambhir_male + ar.gambhir_female + ar.gambhir_boy + ar.gambhir_girl + ar.gambhir_other) AS total_gambhir,

                ar.general_male,
                ar.general_female,
                ar.general_boy,
                ar.general_girl,
                ar.general_other,
                (ar.general_male + ar.general_female + ar.general_boy + ar.general_girl + ar.general_other) AS total_general,

                ar.animal_death,
                ar.animal_injured,
                ar.est_amount,
                ar.damage_vehicle,
                ar.txt_accident_reason,
                ar.remarks,

                ar.office_id,
                ar.created_by,
                ar.updated_by,

                CONCAT(c.name_np, ', ', d.name_np, ', ', s.name_np) AS location,
                art.name_np AS accident_type,
                arsn.name_np AS accident_reason,
                v.name_np AS vehicle_name,

                COUNT(*) AS count

            FROM accident_records ar WHERE ar.office_id=${office_id}

            JOIN accident_record_reasons arr ON arr.accident_id = ar.id
            JOIN accident_reasons arsn ON arsn.id = arr.accident_reason_id
            JOIN accident_reason_type art ON art.id = arsn.reason_type
            JOIN accident_vehicles av ON av.accident_id = ar.id
            JOIN vehicles v ON v.id = av.vehicle_id
            JOIN np_municipalities c ON c.id = ar.municipality_id
            JOIN np_districts d ON d.id = ar.district_id
            JOIN np_states s ON s.id = ar.state_id

            GROUP BY 
                ar.date,
                ar.accident_time,
                c.name_np,
                d.name_np,
                s.name_np,
                ar.ward,
                ar.road_name,
                ar.accident_location,

                ar.death_male,
                ar.death_female,
                ar.death_boy,
                ar.death_girl,
                ar.death_other,

                ar.gambhir_male,
                ar.gambhir_female,
                ar.gambhir_boy,
                ar.gambhir_girl,
                ar.gambhir_other,

                ar.general_male,
                ar.general_female,
                ar.general_boy,
                ar.general_girl,
                ar.general_other,

                ar.animal_death,
                ar.animal_injured,
                ar.est_amount,
                ar.damage_vehicle,
                ar.txt_accident_reason,
                ar.remarks,

                ar.office_id,
                ar.created_by,
                ar.updated_by,

                art.name_np,
                arsn.name_np,
                v.name_np

            ORDER BY ar.date DESC
            `
        const records = await query(sql1);

            
        // All vehicles
        const vehicles = await query(`SELECT name_np FROM vehicles`);

        // All accident types and reasons
        const typesAndReasons = await query(`
        SELECT art.name_np AS accident_type, arsn.name_np AS accident_reason
        FROM accident_reason_type art
        JOIN accident_reasons arsn ON arsn.reason_type = art.id
      `);
        // console.log('records:', records)
        // console.log('types:', typesAndReasons)
        res.json({
            Status: true,
            message: "Records fetched successfully.",
            records,
            vehicles: vehicles.map(v => v.name_np),
            typesAndReasons,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});


export { router as accidentRoute };
