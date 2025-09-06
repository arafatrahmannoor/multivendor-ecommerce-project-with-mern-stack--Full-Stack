import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    name: {
        type: String,
        required:true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ['user', 'admin', 'vendor'],
        default: 'user'
    },
    profilePicture: {
        type: String,
        default: 'profile_pictures/default.jpg'
    },
    passwordHistory: [
        {
            hash: { type: String, required: true },
            changedAt: { type: Date, default: Date.now }
        }
    ],
    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


const User = mongoose.model('User', userSchema);

export default User;