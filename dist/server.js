"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gateway_1 = __importDefault(require("./gateway"));
const env_1 = require("./config/env");
const launch_schema_1 = require("./config/launch-schema");
const PORT = Number(env_1.env.port) || 3000;
const HOST = '0.0.0.0'; // Listen on all interfaces for LAN access
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, launch_schema_1.ensureLaunchSchema)();
    }
    catch (error) {
        console.error('[LaunchSchema] bootstrap failed:', (error === null || error === void 0 ? void 0 : error.message) || error);
    }
    gateway_1.default.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
        console.log(`Environment: ${env_1.env.NODE_ENV}`);
        console.log(`For Expo Go, use: http://<YOUR_LAN_IP>:${PORT}/api`);
    });
});
void startServer();
