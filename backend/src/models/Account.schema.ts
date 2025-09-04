import mongoose, {Schema} from 'mongoose';
import {SmartAccountDocument} from '../types';

const accountSchema = new Schema<SmartAccountDocument>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    address: {
        type: String,
        required: true,
        lowercase: true,
        index: true,
        validate: {
            validator: function (v: string) {
                return /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: 'Address must be a valid Ethereum address'
        }
    },
    chainId: {
        type: Number,
        required: true,
        index: true,
        default: 84532 // Base Sepolia
    },
    isDeployed: {
        type: Boolean,
        required: true,
        default: false,
        index: true
    },
    balance: {
        type: String,
        default: null
    },
    nonce: {
        type: Number,
        default: null
    },
    signerAddress: {
        type: String,
        required: false,
        index: true,
        validate: {
            validator: function (v: string) {
                return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: 'Signer address must be a valid Ethereum address'
        }
    },
    alchemyAccountId: {
        type: String,
        sparse: true, // Allows multiple null values
        index: true
    },
    factoryAddress: {
        type: String,
        validate: {
            validator: function (v: string) {
                return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: 'Factory address must be a valid Ethereum address'
        }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
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
    collection: 'smart_accounts'
});

// Compound indexes for efficient querying in centralized wallet system
accountSchema.index({userId: 1, isActive: 1}); // Find active accounts for user
accountSchema.index({signerAddress: 1, isActive: 1}); // Find accounts by signer
accountSchema.index({chainId: 1, isDeployed: 1, isActive: 1}); // Chain-specific deployed accounts
accountSchema.index({createdAt: -1}); // Latest accounts first
accountSchema.index({userId: 1, address: 1, chainId: 1}, {unique: true}); // Unique address per user per chain

// Transform _id to ID when converting to JSON
accountSchema.set('toJSON', {
    transform: function (_doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const SmartAccountModel = mongoose.model<SmartAccountDocument>('SmartAccount', accountSchema);
