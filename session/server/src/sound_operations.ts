import Crypto from 'crypto'
import {
  CREATE_SOUND_RPC,
  CreateSoundRequest,
  CreateSoundResponse,
  DELETE_SOUND_RPC,
  DeleteSoundRequest,
  DeleteSoundResponse,
  ErrorResponse,
  GET_SOUNDS_RPC,
  GetSoundsResponse,
  UPDATE_SOUND_RPC,
  UpdateSoundRequest,
  UpdateSoundResponse,
  UploadSoundURLParams,
  errorResponse,
  UPLOAD_WAVE, 
  UploadSoundResponse, 
  DOWNLOAD_WAVE
} from '../../../shared/api.js'
import Deferred from '../../../shared/deferred.js'

import { RPCHostMethod } from '../../../shared/rpc.js'
import { createSound, deleteSound, getSound, getSounds, updateSound } from './data_state.js'

import fs from 'fs'
import path from 'path'

const TMP_DIR = '/tmp/jdam-sounds/'

if (fs.existsSync(TMP_DIR)) {
  fs.rmSync(TMP_DIR, { recursive: true })
}
fs.mkdirSync(TMP_DIR, { recursive: true })

export const operations: Record<string, RPCHostMethod> = {
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
    
    return deleteSound(request.id)
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

import express from 'express'
import { ffmpegConvert } from '../../../ffmpeg/src/convert.js'
import mime from 'mime'

export const router = express.Router()

router.post(UPLOAD_WAVE, async (req, res: express.Response<UploadSoundResponse | ErrorResponse>) => {
  const contentType = req.headers['content-type']
  if (!contentType) {
    res.json(errorResponse([ 'a content-type header must be supplied' ]))
    return
  }

  const extension = mime.getExtension(contentType) 
  if (!extension) {
    res.json(errorResponse([ `unable to resolve content-type "${contentType}" to audio file extension` ]))
    return
  }

  const { name, soundId } = req.query as UploadSoundURLParams

  if (!soundId) {
    res.json(errorResponse([ 'empty soundId was supplied.' ]))
    return
  }

  const existingSound = getSound(soundId)
  if (!existingSound) { 
    res.json(errorResponse([ `sound with id "${soundId}" does not exist` ]))
    return
  }

  const id = Crypto.randomUUID()
  const filePath = path.resolve(TMP_DIR, `${id}.flac`)

  try {
    const ffmpegTransformer = ffmpegConvert({ 
      inputFormat: extension,
      outputFormat: 'flac'
    })

    const writeDone = new Deferred<boolean>()
    const writeStream = fs.createWriteStream(filePath)

    writeStream.once('close', () => { writeDone.resolve(true) })
    writeStream.once('error', err => { writeDone.reject(err) })

    req.pipe(ffmpegTransformer).pipe(writeStream)

    await writeDone.promise

    const stats = fs.statSync(filePath)

    existingSound.name = name
    existingSound.path = filePath
    existingSound.size = stats.size
    existingSound.length = 1_000 // TODO: process the sound with ffmpeg and get length in millis

    res.json({
      ts: Date.now(),
      result: 'success',
      data: existingSound
    })
  } catch (err) {
    res.json(errorResponse([ 'sound upload encountered an error', (err as Error).message ])).end()
    return
  }

})

router.get(DOWNLOAD_WAVE, (req, res) => {
  const { soundId } = req.params
  
  if (!soundId) {
    res.writeHead(404, 'No sound ID supplied').end()
    return
  }

  const sound = getSound(soundId)
  if (!sound) {
    res.writeHead(404, 'Sound ID supplied, but no sound found').end()
    return
  }

  const { path: soundPath, size } = sound
  if (!fs.existsSync(soundPath)) {
    res.writeHead(404, 'Sound wave file missing').end()
    return
  }

  try {
    const readStream = fs.createReadStream(soundPath)
    const fileName = soundPath.split(path.sep).at(-1)!

    const mimeType = mime.getType(fileName)
    if (mimeType === null) { 
      res.writeHead(400, 'could not get MIME type').end() 
      return
    }
    
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': size
    })
    
    readStream.pipe(res)
  } catch (err) {
    res.writeHead(400, (err as Error).message).end() 
  }

})

