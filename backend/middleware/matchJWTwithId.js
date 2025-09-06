/* eslint-env node */
/* global process */
import jwt from 'jsonwebtoken';
import User from '../model/user.js';


const matchJWTwithId = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if(!token){
        return res.status(401).json({ message: " Unauthorized" });
    }
    const paramsId = req.params.id;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if(!user){
            return res.status(401).json({ message: " Unauthorized" });
        }

        if(user._id.toString() !== paramsId){
            return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
        }
        req.user = user;
        next();
    }catch (error){
        if(error.name === "TokenExpiredError") {
            const decoded = jwt.decode(token);
            if(!decoded){
                return res.status(401).json({ message: "Invalid token" });
            }
            if(decoded.id !== paramsId){
                return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
            }
            req.user = await User.findById(decoded.id);
            next();
            return;
        }       
        return res.status(401).json ({ message: "Unauthorized" });
    }
};

export default matchJWTwithId;

