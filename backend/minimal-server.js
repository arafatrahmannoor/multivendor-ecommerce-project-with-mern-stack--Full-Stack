
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { register, login } from './controller/authController.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// Middlewares
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://multivendor-ecommerce-project-with-mern-aai7.onrender.com',
        'https://multivendor-ecommerce-project-with-mern.onrender.com'
    ], // allow local and deployed frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control'],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'Authorization'],
    optionsSuccessStatus: 200
}));
app.use(express.json());

// Root route for health check and friendly message
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Auth routes
app.post('/api/auth/login', login);
app.post('/api/auth/register', register);

// Start server
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    // Use the port provided by Render or fallback to 3002 for local development
    const PORT = process.env.PORT || 3002;
        app.listen(PORT, '0.0.0.0', () => console.log(`Minimal test server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });
