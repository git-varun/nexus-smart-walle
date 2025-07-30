import {createApp} from './app';

const PORT = process.env.PORT || 3001;

async function startServer() {
    const app = await createApp();

    app.listen(PORT, () => {
        console.log(`🚀 Backend server running on port ${PORT}`);
    });
}

startServer().catch(console.error);
