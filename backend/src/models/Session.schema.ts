import mongoose, {Document, Schema} from 'mongoose';
import {Session} from '../types';

export interface SessionDocument extends Omit<Session, 'id'>, Document {
    _id: string;
}

const sessionSchema = new Schema<SessionDocument>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {createdAt: 'createdAt', updatedAt: false},
    collection: 'sessions'
});

// // TTL index to automatically remove expired sessions
// sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
//
// // Compound indexes for common queries
// sessionSchema.index({ userId: 1, createdAt: -1 });
// sessionSchema.index({ token: 1, expiresAt: 1 });

// Transform _id to id when converting to JSON
sessionSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const SessionModel = mongoose.model<SessionDocument>('Session', sessionSchema);
