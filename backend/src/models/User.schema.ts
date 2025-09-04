import mongoose, {Schema} from 'mongoose';
import {User} from '../types';
import {UserDocument} from '../types/infrastructure';

const userSchema = new Schema<UserDocument>({
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: false,
        select: false // Don't include password in queries by default
    },
    lastLogin: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {createdAt: 'createdAt', updatedAt: false},
    collection: 'users'
});

// // Indexes
// userSchema.index({ email: 1 });
// userSchema.index({ createdAt: 1 });
// userSchema.index({ lastLogin: 1 });

// Transform _id to id when converting to JSON
userSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
