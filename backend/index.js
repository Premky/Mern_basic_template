import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectMySQL from 'express-mysql-session';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import errorHandler from './middlewares/errorHandler.js';

import { authRouter } from './routes/authRoute.js';
import { publicRouter } from './routes/publicRoutes.js';

// import { driverRouter } from './routes/driverRoute.js';
// import { adminRouter } from './routes/adminRoute.js';
// import { arrestedVehicleRouter } from './routes/arrestedVehiclesRuoute.js';
// import { accidentRoute } from './routes/accidentRoute.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
// app.use(session({
//     secret: process.env.JWT_SECRET || 'jwt_prem_ko_secret_key',
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production', 
//         maxAge: 24 * 60 * 60 * 1000, 
//         httpOnly: true,
//         sameSite: 'None',
//     }
// }));

app.use(session({
    secret: process.env.JWT_SECRET || 'jwt_prem_ko_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true, // only over HTTPS
      sameSite: 'none', // allow cross-site cookies
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  
// Logging
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('tiny'));
}

app.use(compression());

// CORS setup
const hardOrigins = [
    'http://localhost:5173',
    'https://kptpo.onrender.com',
    'https://kptpo-backend.onrender.com',
];

app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || hardOrigins;
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
// app.use(limiter);

// Static files
app.use(express.static('Public'));
app.use('/Uploads', express.static(path.join(__dirname, 'Public', 'Uploads')));

// Routes
app.use('/auth', authRouter);
app.use('/public', publicRouter);
// app.use('/admin', adminRouter);
// app.use('/driver', driverRouter);
// app.use('/av', arrestedVehicleRouter);
// app.use('/accident', accidentRoute);

// Error handler
app.use(errorHandler);

// Server start
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('👋 Server shutting down...');
    process.exit();
});
