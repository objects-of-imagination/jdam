"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CREATE_NODE_PATH = exports.HEARTBEAT_PATH = exports.errorResponse = exports.API_PREFIX = void 0;
exports.API_PREFIX = '/api/v1';
function errorResponse(errors = []) {
    return {
        ts: Date.now(),
        result: 'failure',
        errors
    };
}
exports.errorResponse = errorResponse;
exports.HEARTBEAT_PATH = `${exports.API_PREFIX}/heartbeat`;
exports.CREATE_NODE_PATH = `${exports.API_PREFIX}/create_node`;
