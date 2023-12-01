"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_1 = require("../../../shared/api");
const router = express_1.default.Router();
router.get(api_1.HEARTBEAT_PATH, (_req, res) => {
    res.json({
        ts: Date.now(),
        result: 'success'
    });
});
exports.default = router;
