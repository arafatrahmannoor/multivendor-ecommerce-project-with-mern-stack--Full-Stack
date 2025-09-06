/* eslint-env node */
/* global process */
import jwt from 'jsonwebtoken';
import User from '../model/user.js';

// GET /user/debug-token
async function debugToken(req, res) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id, { password: 0 });
        return res.json({
            message: 'Token is valid',
            tokenPayload: decoded,
            userIdFromToken: decoded.id,
            userFromDatabase: user,
            tokenExpiry: new Date(decoded.exp * 1000),
            isExpired: Date.now() > decoded.exp * 1000,
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired', error: error.message });
        }
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
}

export { debugToken };
