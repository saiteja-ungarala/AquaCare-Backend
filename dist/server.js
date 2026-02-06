"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gateway_1 = __importDefault(require("./gateway"));
const env_1 = require("./config/env");
const PORT = env_1.env.PORT || 3000;
gateway_1.default.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${env_1.env.NODE_ENV}`);
});
