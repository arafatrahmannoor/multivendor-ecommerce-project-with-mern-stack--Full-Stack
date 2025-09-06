const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { register, login } = require('./controller/authcontroller');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

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
        const PORT = process.env.PORT || 3002;
        app.listen(PORT, '0.0.0.0', () => console.log(`Minimal test server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });
