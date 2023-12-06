import Crypto from 'crypto'
import {
  CREATE_SOUND_RPC,
  CreateSoundRequest,
  CreateSoundResponse,
  DELETE_SOUND_RPC,
  DeleteSoundRequest,
  DeleteSoundResponse,
  GET_SOUNDS_RPC,
  GetSoundsResponse,
  UPDATE_SOUND_RPC,
  UpdateSoundRequest,
  UpdateSoundResponse
} from '../../../shared/api'

import { RPCHostMethod } from '../../../shared/rpc'
import { createSound, deleteSound, getSound, getSounds, updateSound } from './data_state'

const operations: Record<string, RPCHostMethod> = {
  [ CREATE_SOUND_RPC ]: async (req): Promise<CreateSoundResponse['response']> => {
    const request = req as CreateSoundRequest['request']

    if (!request.createdBy) {
      throw 'empty user sent to createdBy'
    }

    return createSound({ ...request.sound, createdBy: request.createdBy }, request.nodeId)
  },
  [ DELETE_SOUND_RPC ]: async (req): Promise<DeleteSoundResponse['response']> => {
    const request = req as DeleteSoundRequest['request']

    if (!request.id) {
      throw 'empty id sent to delete sound'
    }

    const existingSound = getSound(request.id)
    if (!existingSound) {
      throw 'no sound found for this id' 
    }
    
    deleteSound(request.id)
    return existingSound
  }, [ UPDATE_SOUND_RPC ]: async (req): Promise<UpdateSoundResponse['response']> => {
    const request = req as UpdateSoundRequest['request']
    if (!request.id) {
      throw 'empty id sent to update sound'
    }

    const existingSound = getSound(request.id)
    if (!existingSound) {
      throw 'no sound found for this id'
    }

    // these properties should never be updated via this RPC
    const updatedSound = updateSound(request)
    if (!updatedSound) {
      throw 'unable to update the node'
    }

    return updatedSound
  },
  [ GET_SOUNDS_RPC ]: async (): Promise<GetSoundsResponse['response']> => {
    return { sounds: getSounds() }
  }
}

export default operations
