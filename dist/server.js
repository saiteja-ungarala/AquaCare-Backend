"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gateway_1 = __importDefault(require("./gateway"));
const env_1 = require("./config/env");
const PORT = Number(env_1.env.port) || 3000;
const HOST = '0.0.0.0'; // Listen on all interfaces for LAN access
gateway_1.default.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Environment: ${env_1.env.NODE_ENV}`);
    console.log(`For Expo Go, use: http://<YOUR_LAN_IP>:${PORT}/api`);
});
