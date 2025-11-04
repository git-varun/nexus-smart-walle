import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(uri: string): Promise<void> {
    if (isConnected) {
        return;
    }

    try {
        await mongoose.connect(uri);
        isConnected = true;
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

export async function disconnectDB(): Promise<void> {
    if (isConnected) {
        await mongoose.disconnect();
        isConnected = false;
        console.log('Disconnected from MongoDB');
    }
}

export function isDBConnected(): boolean {
    return isConnected && mongoose.connection.readyState === 1;
}
