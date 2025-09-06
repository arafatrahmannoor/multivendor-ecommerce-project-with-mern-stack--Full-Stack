/* eslint-env node */
import upload from '../middleware/uploadImage.js';
import User from '../model/user.js';
import path from 'path';
import bcrypt from 'bcrypt';
import fs from 'fs';
import zxcvbn from 'zxcvbn';
import { sendMail } from '../utils/mailer.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const addUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: "User added successfully", user });

    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(400).json({ message: "Email already exists" });
        } else {
            return res.status(500).json({ message: "Error adding user", error });
        }
    }

};


const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 });
        res.status(200).json({ users });

    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};

const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id, { password: 0 });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const name = req.body.name ?? null;
    const email = req.body.email ?? null;
    const password = req.body.password ?? null;
    const role = req.body.role ?? null; // Add role update capability
    
    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) {
            user.name = name;
        }
        if (email) {
            user.email = email;
        }
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }
        if (role && ['user', 'vendor', 'admin'].includes(role)) {
            user.role = role;
        }

        await user.save();
        
        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(200).json({ message: "User updated successfully", user: userResponse });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(400).json({ message: "Email already exists" });
        }
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error });
    }
};

// Ban user (admin only)
const banUser = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.banned = true;
        user.banReason = reason || 'No reason provided';
        user.bannedAt = new Date();
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({ message: "User banned successfully", user: userResponse });
    } catch (error) {
        res.status(500).json({ message: "Error banning user", error: error.message });
    }
};

// Unban user (admin only)
const unbanUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.banned = false;
        user.banReason = null;
        user.bannedAt = null;
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({ message: "User unbanned successfully", user: userResponse });
    } catch (error) {
        res.status(500).json({ message: "Error unbanning user", error: error.message });
    }
};

const updateUserProfilePicture = async (req, res) => {
    const { id } = req.params;
    req.folderName = 'profile_pictures';

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        upload.single('profilePicture')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: "Error uploading file", error: err.message });
            }
            
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            try {
                // Delete previous file if it's not the default
                const previousFile = user.profilePicture;
                if (previousFile && previousFile !== 'profile_pictures/default.jpg') {
                    const previousFilePath = path.join('public', previousFile);
                    if (fs.existsSync(previousFilePath)) {
                        fs.unlinkSync(previousFilePath);
                    }
                }

                // Update user profile picture
                user.profilePicture = path.join(req.folderName, req.file.filename).replace(/\\/g, '/');
                await user.save();
                
                res.status(200).json({ 
                    message: "Profile picture updated successfully", 
                    user: {
                        ...user.toObject(),
                        password: undefined // Don't send password in response
                    }
                });
            } catch (saveError) {
                return res.status(500).json({ message: "Error saving user data", error: saveError.message });
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Error updating profile picture", error: error.message });
    }
};

// Change user password (authenticated user only)
const changeUserPassword = async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    try {
        // Ensure authenticated user from middleware
        const user = req.user;
        if (!user || user._id.toString() !== id) {
            return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "currentPassword and newPassword are required" });
        }

        if (confirmPassword !== undefined && newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New password and confirm password do not match" });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 10) {
            return res.status(400).json({ message: "New password must be at least 10 characters" });
        }

        // Basic composition checks (helps users before zxcvbn)
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasDigit = /\d/.test(newPassword);
        const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
        const checks = { hasUpper, hasLower, hasDigit, hasSymbol };
        if (!(hasUpper && hasLower && hasDigit && hasSymbol)) {
            return res.status(400).json({
                message: "Password must include uppercase, lowercase, number, and symbol",
                checks
            });
        }

    // Check password strength with zxcvbn (score 0-4); require >= 3, with user context
    const strength = zxcvbn(newPassword, [user.email, user.name]);
        if (strength.score < 3) {
            return res.status(400).json({ 
                message: "Password is too weak",
                score: strength.score,
                feedback: strength.feedback
            });
        }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentValid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // Prevent reusing the same password
        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) {
            return res.status(400).json({ message: "New password cannot be the same as the current password" });
        }

        // Enforce password history (disallow reuse of last 5)
        const history = user.passwordHistory || [];
        for (const entry of history.slice(0, 5)) {
            const reused = await bcrypt.compare(newPassword, entry.hash);
            if (reused) {
                return res.status(400).json({ message: "New password must not match your last 5 passwords" });
            }
        }

        const newHashed = await bcrypt.hash(newPassword, 10);

        // Push old password into history (keep max 5)
        if (user.password) {
            user.passwordHistory = [{ hash: user.password, changedAt: user.passwordChangedAt || new Date() }, ...history].slice(0, 5);
        }

        user.password = newHashed;
        const now = new Date();
        user.passwordChangedAt = now;
        user.updatedAt = now;
        await user.save();

        // Fire-and-forget email notification (non-blocking)
        try {
            if (user.email) {
                sendMail({
                    to: user.email,
                    subject: 'Your password was changed',
                    text: `Hello ${user.name || ''}, your password was changed on ${now.toISOString()}. If this wasn't you, please reset your password immediately.`,
                }).catch(() => {});
            }
        } catch {
            /* ignore mail errors */
        }

        const safeUser = user.toObject();
        delete safeUser.password;

        // Include simple rate limit headers if available (from limiter)
        const rate = req.rateLimit;
        const meta = rate ? { remaining: rate.remaining, limit: rate.limit, resetTime: rate.resetTime } : undefined;

        return res.status(200).json({ message: "Password changed successfully", user: safeUser, rateLimit: meta });
    } catch (error) {
        return res.status(500).json({ message: "Error changing password", error: error.message });
    }
};

export { addUser, getAllUsers, getUserById, updateUser, deleteUser, updateUserProfilePicture, changeUserPassword, banUser, unbanUser };