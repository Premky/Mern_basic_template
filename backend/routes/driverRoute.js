import express from 'express';
import { promisify } from 'util';
import con from '../utils/db.js';
import { v2 as cloudinary } from 'cloudinary';
import { upload, cloudinaryUpload } from '../middlewares/cloudinaryUpload.js';
import NepaliDateConverter from 'nepali-date-converter';

const router = express.Router();
const query = promisify(con.query).bind(con);

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Convert BS date to AD
function convertToAD(bsdate) {
    try {
        const dobAD = NepaliDateConverter.parse(bsdate);
        const ad = dobAD.getAD();
        return `${ad.year}-${(ad.month + 1).toString().padStart(2, '0')}-${ad.date.toString().padStart(2, '0')}`;
    } catch (err) {
        console.error(err);
        return null;
    }
}

// ADD Driver API
router.post("/add_driver", upload.single("image"), cloudinaryUpload, async (req, res) => {
    try {
        const {
            vehicledistrict, drivername, driverdob, vehicle_no, vehicle_name, state, district,
            municipality, driverward, country, driverfather, lisence_no, lisencecategory, driverctz_no,
            ctz_iss, mentalhealth, drivereye, driverear, drivermedicine, start_route, end_route, remarks,
        } = req.body;

        const driverdobAD = convertToAD(driverdob);
        console.log(req.file); // Cloudinary response will be available here

        // Cloudinary image URL is now available as req.file.secure_url
        const imageUrl = req.file ? req.file.secure_url : null;  // Use the secure_url from Cloudinary

        const created_by = '0';

        const sql = `
            INSERT INTO tango_driver 
            (vehicledistrict, drivername, driverdob, driverdob_ad, vehicle_no, vehicle_name, state, district, municipality, 
            driverward, country, driverfather, lisence_no, lisencecategory, driverctz_no, ctz_iss, mentalhealth, 
            drivereye, driverear, drivermedicine, start_route, end_route, remarks, driverphoto, created_by) 
            VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?,?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            vehicledistrict, drivername, driverdob, driverdobAD, vehicle_no, vehicle_name, state, district, municipality,
            driverward, country, driverfather, lisence_no, lisencecategory, driverctz_no, ctz_iss, mentalhealth,
            drivereye, driverear, drivermedicine, start_route, end_route, remarks, imageUrl, created_by
        ];

        const result = await query(sql, values);
        res.json({ Status: true, message: "Driver added successfully", driverId: result.insertId, imageUrl });
    } catch (error) {
        console.error("Error adding driver:", error);
        res.status(500).json({ Status: false, message: "Database error", error });
    }
});



// GET All Drivers API
router.get("/get_drivers", async (req, res) => {
    const sql = `SELECT 
                td.id,
                td.vehicle_no, td.start_route, td.end_route, td.drivername, td.driverdob, 
                td.driverward, td.driverfather, td.lisence_no, td.driverctz_no, td.mentalhealth, 
                td.drivereye, td.driverear, td.drivermedicine, td.driverphoto, td.remarks,
                td.vehicledistrict AS vehicledistrict_id, td.vehicle_name AS vehiclename_id, 
                td.country AS country_id, td.state AS state_id, td.district AS district_id, 
                td.municipality AS municipality_id, td.lisencecategory AS category_id, 
                td. ctz_iss AS ctziss_id,
                nd1.name_np AS vehicledistrict, v.name_np AS vehicle_name, nc.name_np AS country, 
                ns.name_np AS state, nd2.name_np AS district, nm.name_np AS municipality, 
                lc.name_en AS lisencecategory, nd3.name_np AS ctz_iss, u.name AS created_by
            FROM 
                tango_driver td
            LEFT JOIN np_districts nd1 ON td.vehicledistrict = nd1.id
            LEFT JOIN vehicles v ON td.vehicle_name = v.id
            LEFT JOIN np_country nc ON td.country = nc.id
            LEFT JOIN np_states ns ON td.state = ns.id
            LEFT JOIN np_districts nd2 ON td.district = nd2.id
            LEFT JOIN np_municipalities nm ON td.municipality = nm.id
            LEFT JOIN lisence_category lc ON td.lisencecategory = lc.id
            LEFT JOIN np_districts nd3 ON td.ctz_iss = nd3.id
            LEFT JOIN users u ON td.created_by = u.id;          
                `;
    try {
        const result = await query(sql);
        return res.json({ Status: true, Result: result, message:'Records fetched successfully.' })
    } catch (err) {
        console.error("Database Query Error:", err);
        res.status(500).json({ Status: false, Error: "Internal Server Error" })
    }
});


// Update Driver API
router.put("/update_driver/:id", upload.single("image"), cloudinaryUpload, async (req, res) => {
    try {
        const { id } = req.params;  // Driver ID from URL params
        const {
            vehicledistrict, drivername, driverdob, vehicle_no, vehicle_name, state, district,
            municipality, driverward, country, driverfather, lisence_no, lisencecategory, driverctz_no,
            ctz_iss, mentalhealth, drivereye, driverear, drivermedicine, start_route, end_route, remarks,
        } = req.body;

        const driverdobAD = convertToAD(driverdob);
        console.log(req.file);  // Cloudinary response will be available here

        // Get current image URL from Cloudinary (if no new image, keep the old image URL)
        const imageUrl = req.file ? req.file.secure_url : null;

        const sql = `
            UPDATE tango_driver SET
                vehicledistrict = ?, drivername = ?, driverdob = ?, driverdob_ad = ?, vehicle_no = ?, vehicle_name = ?, 
                state = ?, district = ?, municipality = ?, driverward = ?, country = ?, driverfather = ?, 
                lisence_no = ?, lisencecategory = ?, driverctz_no = ?, ctz_iss = ?, mentalhealth = ?, drivereye = ?, 
                driverear = ?, drivermedicine = ?, start_route = ?, end_route = ?, remarks = ?, driverphoto = ?
            WHERE id = ?
        `;

        const values = [
            vehicledistrict, drivername, driverdob, driverdobAD, vehicle_no, vehicle_name, state, district, municipality,
            driverward, country, driverfather, lisence_no, lisencecategory, driverctz_no, ctz_iss, mentalhealth,
            drivereye, driverear, drivermedicine, start_route, end_route, remarks, imageUrl, id
        ];

        const result = await query(sql, values);
        
        if (result.affectedRows > 0) {
            res.json({ Status: true, message: "Driver updated successfully", driverId: id, imageUrl });
        } else {
            res.status(404).json({ Status: false, message: "Driver not found" });
        }
    } catch (error) {
        console.error("Error updating driver:", error);
        res.status(500).json({ Status: false, message: "Database error", error });
    }
});


// DELETE Driver API
router.delete("/delete_driver/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const existingDriver = await query("SELECT driverphoto FROM tango_driver WHERE id = ?", [id]);
        
        if (!existingDriver.length) {
            return res.status(404).json({ Status: false, message: "Driver not found" });
        }

        // Extract the public ID from the Cloudinary URL
        const driverPhotoUrl = existingDriver[0].driverphoto;
        
        if (driverPhotoUrl) {
            const oldImagePublicId = driverPhotoUrl.split('/').pop().split('.')[0];  // Get public ID from the URL
            
            // Cloudinary destroy API to delete the image using the public ID
            const result = await cloudinary.uploader.destroy(oldImagePublicId);
            console.log("Image deleted from Cloudinary:", result);
        }

        // Delete the driver record from the database
        await query("DELETE FROM tango_driver WHERE id = ?", [id]);
        
        res.json({ Status: true, message: "Driver and image deleted successfully" });
    } catch (error) {
        console.error("Error deleting driver:", error);
        res.status(500).json({ Status: false, message: "Database error", error });
    }
});


export { router as driverRouter };
