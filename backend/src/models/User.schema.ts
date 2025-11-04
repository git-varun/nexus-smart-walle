import mongoose, {Document, Schema} from 'mongoose';

export interface IUser extends Document {
    email?: string;
    username?: string;
    displayName?: string;
    profileImageUrl?: string;
    avatarConfig?: {
        seed: string;
        style: string;
        backgroundColor: string;
        textColor: string;
        pattern: string;
    };
    preferences?: {
        theme?: 'light' | 'dark' | 'auto';
        language?: string;
        notifications?: boolean;
        privacy: {
            showEmail?: boolean;
            showOnlineStatus?: boolean;
        };
    };
    password: string;
    createdAt: Date;
    lastLogin?: Date;
}

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    username: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        minlength: 3,
        maxlength: 20,
        match: /^[a-zA-Z0-9_-]+$/
    },
    displayName: {
        type: String,
        required: false,
        maxlength: 50
    },
    profileImageUrl: {
        type: String,
        required: false
    },
    avatarConfig: {
        seed: {type: String, required: false},
        style: {type: String, required: false},
        backgroundColor: {type: String, required: false},
        textColor: {type: String, required: false},
        pattern: {type: String, required: false}
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        },
        language: {
            type: String,
            default: 'en'
        },
        notifications: {
            type: Boolean,
            default: true
        },
        privacy: {
            showEmail: {
                type: Boolean,
                default: false
            },
            showOnlineStatus: {
                type: Boolean,
                default: true
            }
        }
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        required: false
    }
});

userSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const UserModel = mongoose.model<IUser>('User', userSchema);
