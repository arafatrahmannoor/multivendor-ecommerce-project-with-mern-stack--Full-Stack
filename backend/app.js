/* eslint-env node */
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();

// CORS configuration for development - very permissive for troubleshooting
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow any localhost origin for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    // For development, allow any origin
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Authorization'],
  optionsSuccessStatus: 200
};

// Core middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Request logging middleware with enhanced CORS debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
    console.log('User-Agent:', req.headers['user-agent']);
    if (req.headers.authorization) {
        console.log('Auth header present:', req.headers.authorization.substring(0, 20) + '...');
    }
    
    // Add CORS headers manually as backup
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('Handling preflight request');
        res.status(200).end();
        return;
    }
    
    next();
});

// Mount main API router
import apiRouter from './router/api.js';
app.use('/api', apiRouter);

// Global error handler
import errorHandler from './middleware/errorHandler.js';
app.use(errorHandler);

export default app;
