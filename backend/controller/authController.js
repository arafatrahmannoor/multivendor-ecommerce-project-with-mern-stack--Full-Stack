/* eslint-env node */
/* global process */
import User from '../model/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendMail } from '../utils/mailer.js';

const register = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {

        //validate
        if(!name || !email || !password || !role){
            return res.status(400).json({ message: "All fields are required" });
        }



        //role is user or vendor
        if(role !== "user" && role !== "vendor"){
            return res.status(400).json({ message: "Role must be user or vendor" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);


        const user = new User({ name, email, password: hashedPassword, role });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({ message: "User register successfully", user, token });
    } catch(error) {
        if (error.code === 11000 && error.keyPattern?.email){
            return res.status(400).json({ message: "Email already exists", error });
        }
    }

};

const login =  async (req, res) =>{
    const { email, password } = req.body;

    try {
        const user =  await User.findOne({ email });
        if(!user){
            return res.status(401).json({ message: "User not Found" });
        }
            const isMatch = await bcrypt.compare(password, user.password);
            if(!isMatch){
                return res.status(401).json({ message: "Invalid credentials" });

            }
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.status(200).json({ message: "Login successful", user, token });

        } catch(error){
            res.status(500).json({ message: "Error logging in", error })
        }

        
};

// Request a password reset: issues a token and emails it
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) {
            // Avoid user enumeration: respond success anyway
            return res.status(200).json({ message: 'If that email exists, a reset link has been sent' });
        }

        // Generate token (random) and hash it for storage
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        user.passwordResetToken = tokenHash;
        user.passwordResetExpires = expires;
        await user.save();

        const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${resetToken}`;

        // Send email (non-blocking)
        sendMail({
            to: user.email,
            subject: 'Password reset instructions',
            text: `Hello ${user.name || ''},\n\nUse the link below to reset your password. It expires in 15 minutes.\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        }).catch(() => {});

        return res.status(200).json({ message: 'If that email exists, a reset link has been sent' });
    } catch (error) {
        return res.status(500).json({ message: 'Error processing password reset', error: error.message });
    }
};

// Reset password using token
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body || {};
    try {
        if (!token) return res.status(400).json({ message: 'Token is required' });
        if (!newPassword) return res.status(400).json({ message: 'newPassword is required' });
        if (confirmPassword !== undefined && newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match' });
        }

        // Validate minimal policy here; reuse zxcvbn in user controller if needed
        if (newPassword.length < 10) return res.status(400).json({ message: 'New password must be at least 10 characters' });

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            passwordResetToken: tokenHash,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) return res.status(400).json({ message: 'Token is invalid or has expired' });

        // Reuse some policy from change flow
        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) return res.status(400).json({ message: 'New password cannot be the same as the current password' });

        const newHashed = await bcrypt.hash(newPassword, 10);
        // Move current hash to history
        const history = user.passwordHistory || [];
        if (user.password) {
            user.passwordHistory = [{ hash: user.password, changedAt: user.passwordChangedAt || new Date() }, ...history].slice(0, 5);
        }

        user.password = newHashed;
        const now = new Date();
        user.passwordChangedAt = now;
        user.updatedAt = now;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Notify user
        sendMail({
            to: user.email,
            subject: 'Your password was reset',
            text: `Hello ${user.name || ''}, your password was reset on ${now.toISOString()}. If this wasn't you, please contact support immediately.`,
        }).catch(() => {});

        return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        return res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};

export { register, login, forgotPassword, resetPassword };