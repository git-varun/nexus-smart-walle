import mongoose, {Document, Schema} from 'mongoose';

export interface IAccount extends Document {
    userId: string;
    address: string;
    chainId: number;
    isDeployed: boolean;
    balance?: string;
    nonce?: number;
    signerAddress?: string;
    alchemyAccountId?: string;
    requestId?: string;
    salt?: string;
    accountType?: string;
    factoryAddress?: string;
    factoryData?: string;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const accountSchema = new Schema<IAccount>({
    userId: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true,
        lowercase: true
    },
    chainId: {
        type: Number,
        required: true,
        default: 84532
    },
    isDeployed: {
        type: Boolean,
        default: false
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
        default: null
    },
    alchemyAccountId: {
        type: String,
        default: null
    },
    requestId: {
        type: String,
        default: null
    },
    salt: {
        type: String,
        default: null
    },
    accountType: {
        type: String,
        default: null
    },
    factoryAddress: {
        type: String,
        default: null
    },
    factoryData: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
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
    timestamps: {createdAt: 'createdAt', updatedAt: 'updatedAt'}
});

accountSchema.set('toJSON', {
    transform: function (_doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const AccountModel = mongoose.model<IAccount>('Account', accountSchema);
