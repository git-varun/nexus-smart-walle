import mongoose, {Document, Schema} from 'mongoose';
import {Transaction, TransactionStatus} from '../types';

export interface TransactionDocument extends Omit<Transaction, 'id'>, Document {
    _id: string;
}

const transactionSchema = new Schema<TransactionDocument>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    smartAccountId: {
        type: String,
        required: true,
        index: true
    },
    hash: {
        type: String,
        unique: true,
        index: true
    },
    userOpHash: {
        type: String,
        required: true,
        default: null,
        unique: true,
        index: true
    },
    to: {
        type: String,
        required: true,
        lowercase: true
    },
    chainId: {
        type: Number,
        required: true,
        index: true,
    },
    value: {
        type: String,
        default: null
    },
    data: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'failed'] as TransactionStatus[],
        required: true,
        default: 'pending',
        index: true
    },
    gasUsed: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {createdAt: 'createdAt', updatedAt: 'updatedAt'},
    collection: 'transactions'
});

// // Indexes
// transactionSchema.index({ userId: 1, createdAt: -1 });
// transactionSchema.index({ smartAccountId: 1, createdAt: -1 });
// transactionSchema.index({ hash: 1 });
// transactionSchema.index({ userOpHash: 1 });
// transactionSchema.index({ status: 1, createdAt: -1 });
// transactionSchema.index({ createdAt: 1 });

// Transform _id to id when converting to JSON
transactionSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const TransactionModel = mongoose.model<TransactionDocument>('Transaction', transactionSchema);
