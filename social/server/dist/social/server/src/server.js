"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const homepage_1 = __importDefault(require("./homepage"));
const heartbeat_1 = __importDefault(require("./heartbeat"));
const child_process_1 = __importDefault(require("child_process"));
const path_1 = __importDefault(require("path"));
const database_1 = __importStar(require("./database"));
const app = (0, express_1.default)();
if (process.env.NODE_ENV === 'dev') {
    const vite = child_process_1.default.spawn('npm', ['run', 'dev'], {
        cwd: path_1.default.resolve(process.cwd(), '../web'),
        stdio: 'inherit'
    });
    process.on('exit', () => {
        vite.kill('SIGKILL');
    });
}
else {
    app.use(homepage_1.default);
}
const surreal = child_process_1.default.spawn('surreal', [
    'start',
    '--auth',
    '--user',
    database_1.DB_USER,
    '--pass',
    database_1.DB_PASS,
    '--bind',
    '127.0.0.1:8000',
    process.env.NODE_ENV === 'dev' ? 'memory' : `file:${database_1.DB_FILE}`
]);
const onData = (data) => {
    const string = Buffer.from(data).toString('utf8');
    console.log(string);
    if (string.includes('Started web server on')) {
        (0, database_1.connect)();
        surreal.stderr?.off('data', onData);
    }
};
surreal.stderr?.on('data', onData);
process.on('exit', () => {
    surreal.kill('SIGKILL');
});
const PORT = 3000;
app.use(heartbeat_1.default);
app.use(database_1.default);
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});
