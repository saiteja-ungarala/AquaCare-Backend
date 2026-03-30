import app from './gateway';
import { env } from './config/env';
import { ensureLaunchSchema } from './config/launch-schema';

const PORT = Number(env.port) || 3000;
const HOST = '0.0.0.0'; // Listen on all interfaces for LAN access

const startServer = async () => {
    try {
        await ensureLaunchSchema();
    } catch (error: any) {
        console.error('[LaunchSchema] bootstrap failed:', error?.message || error);
    }

    app.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
        console.log(`Environment: ${env.NODE_ENV}`);
        console.log(`For Expo Go, use: http://<YOUR_LAN_IP>:${PORT}/api`);
    });
};

void startServer();
