export const API_PREFIX = '/api/v1';
export function errorResponse(errors = []) {
    return {
        ts: Date.now(),
        result: 'failure',
        errors
    };
}
export function isErrorResponse(response) {
    return response.result === 'failure';
}
export const WS_PATH = `${API_PREFIX}/ws`;
export const HEARTBEAT_PATH = `${API_PREFIX}/heartbeat`;
export const PERSON_OPERATIONS_PATH = `${API_PREFIX}/person`;
export const SESSION_CONNECT_RPC = 'session-connect';
export const CREATE_NODE_RPC = 'create-node';
export const DELETE_NODE_RPC = 'delete-node';
export const UPDATE_NODE_RPC = 'update-node';
export const GET_NODES_RPC = 'get-nodes';
export const CREATE_SOUND_RPC = 'create-sound';
export const DELETE_SOUND_RPC = 'delete-sound';
export const UPDATE_SOUND_RPC = 'update-sound';
export const GET_SOUNDS_RPC = 'get-sounds';
export const LINK_SOUND_RPC = 'link-sound';
export const UNLINK_SOUND_RPC = 'unlink-sound';
export const UPLOAD_WAVE = `${API_PREFIX}/wave`;
export const DOWNLOAD_WAVE = `${API_PREFIX}/wave/:soundId`;
export const HOST_INIT_RPC = 'host-init';
