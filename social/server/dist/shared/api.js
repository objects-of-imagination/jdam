"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOST_INIT_RPC = exports.UPLOAD_SOUND = exports.UNLINK_SOUND_RPC = exports.LINK_SOUND_RPC = exports.GET_SOUNDS_RPC = exports.UPDATE_SOUND_RPC = exports.DELETE_SOUND_RPC = exports.CREATE_SOUND_RPC = exports.GET_NODES_RPC = exports.UPDATE_NODE_RPC = exports.DELETE_NODE_RPC = exports.CREATE_NODE_RPC = exports.SESSION_CONNECT_RPC = exports.PERSON_OPERATIONS_PATH = exports.HEARTBEAT_PATH = exports.WS_PATH = exports.errorResponse = exports.API_PREFIX = void 0;
exports.API_PREFIX = '/api/v1';
function errorResponse(errors = []) {
    return {
        ts: Date.now(),
        result: 'failure',
        errors
    };
}
exports.errorResponse = errorResponse;
exports.WS_PATH = `${exports.API_PREFIX}/ws`;
exports.HEARTBEAT_PATH = `${exports.API_PREFIX}/heartbeat`;
exports.PERSON_OPERATIONS_PATH = `${exports.API_PREFIX}/person`;
exports.SESSION_CONNECT_RPC = 'session-connect';
exports.CREATE_NODE_RPC = 'create-node';
exports.DELETE_NODE_RPC = 'delete-node';
exports.UPDATE_NODE_RPC = 'update-node';
exports.GET_NODES_RPC = 'get-nodes';
exports.CREATE_SOUND_RPC = 'create-sound';
exports.DELETE_SOUND_RPC = 'delete-sound';
exports.UPDATE_SOUND_RPC = 'update-sound';
exports.GET_SOUNDS_RPC = 'get-sounds';
exports.LINK_SOUND_RPC = 'link-sound';
exports.UNLINK_SOUND_RPC = 'unlink-sound';
exports.UPLOAD_SOUND = `${exports.API_PREFIX}/sound`;
exports.HOST_INIT_RPC = 'host-init';
