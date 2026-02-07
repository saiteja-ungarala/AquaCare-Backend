import app from './gateway';
import { env } from './config/env';

const PORT = Number(env.port) || 3000;
const HOST = '0.0.0.0'; // Listen on all interfaces for LAN access

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`For Expo Go, use: http://<YOUR_LAN_IP>:${PORT}/api`);
});
