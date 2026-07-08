"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_validator_1 = require("./config/env.validator");
// Assert env specifications
(0, env_validator_1.validateEnv)();
const PORT = process.env.PORT || 5000;
app_1.default.listen(PORT, () => {
    console.log(`[Server] CRMpro AI CSV Importer backend running on http://localhost:${PORT}`);
});
