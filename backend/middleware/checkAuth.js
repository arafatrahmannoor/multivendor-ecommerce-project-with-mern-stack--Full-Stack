/* eslint-env node */
/* global process */
import User from '../model/user.js';
import jwt from 'jsonwebtoken';

const checkAuth = async (req, res, next) => {
    console.log('=== CHECKAUTH MIDDLEWARE ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Authorization header:', req.headers.authorization);
    
    const auth = req.headers.authorization || '';
    const [scheme, token] = auth.split(' ');
    
    console.log('Auth scheme:', scheme);
    console.log('Token present:', !!token);
    
    if (scheme !== 'Bearer' || !token) {
        console.log('Auth failed: Invalid scheme or missing token');
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
        console.log('Attempting to verify token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);
        
        req.user = await User.findById(decoded.id);
        console.log('User found:', !!req.user);
        
        if (!req.user) {
            console.log('Auth failed: User not found in database');
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        console.log('Auth successful for user:', req.user.email);
        next();
    } catch (error) {
        console.log('JWT verification error:', error.message);
        if (error.name === 'TokenExpiredError') {
            const decoded = jwt.decode(token);
            if (!decoded) return res.status(401).json({ message: 'Invalid token' });
            const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '30m' });
            req.user = await User.findById(decoded.id);
            if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
            res.setHeader('Authorization', `Bearer ${newToken}`);
            next();
            return;
        }
        return res.status(401).json({ message: 'Unauthorized' });
    }
};


const checkAdmin = async (req, res, next) => {
    await checkAuth(req, res, async () => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
        next();
    });
};


const checkVendor = async (req, res, next) => {
    await checkAuth(req, res, async () => {
        if (req.user.role !== 'vendor') return res.status(403).json({ message: 'Forbidden' });
        next();
    });
};

export { checkAuth, checkAdmin, checkVendor };