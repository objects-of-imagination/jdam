import { Duration } from '../../shared/data.js'
import { Transform } from 'stream'

import { ffmpeg } from './ffmpeg.js'

export interface FfmpegTransformParams {
  inputFormat: string
  outputFormat: string
  sampleRate?: number
  channels?: number
  start?: Duration
  end?: Duration
  codec?: string
  addArgs?: string[]
}

export function ffmpegConvert ({
  inputFormat,
  outputFormat = 's8',
  sampleRate = 48000,
  channels = 2,
  start,
  end,
  codec,
  addArgs = []
}: FfmpegTransformParams) {

  /* default is signed PCM little-endian data */

  const args: (string | number)[] = []

  args.push('-f', inputFormat) // need to tell the input stream what format to be in
  args.push('-i', '-') // stdin

  if (start) {
    args.push('-ss', `${start}ms`)
  }

  if (end) {
    args.push('-to', `${end}ms`)
  }

  if (codec) {
    args.push('-acodec', codec)
  }

  args.push(...addArgs)

  args.push(...[
    '-ar', sampleRate, /* set the bit rate */
    '-ac', channels, /* set the number of channels */
    '-f', outputFormat,
    'pipe:1'
  ]) // write directly to stdout, which we will pipe to outputStream

  // console.log(args)

  const ffmpegProcess = ffmpeg(args.map(value => String(value)))

  const result = new Transform({
    transform(chunk, encoding, callback) {
      if (ffmpegProcess.stdin.write(chunk, encoding)) {
        process.nextTick(callback)
        return
      } 
     
      ffmpegProcess.stdin.once('drain', callback)
    },
    flush(callback) {
      ffmpegProcess.stdin.end()
      if (ffmpegProcess.stdout.destroyed) { 
        callback()
        return 
      }

      ffmpegProcess.stdout.once('close', () => callback())
    }
  })

  ffmpegProcess.stdin.on('error', (err: Error & { code?: string }) => {
    if (err.code === 'EPIPE') {
      result.emit('end')
      return 
    } 
    result.destroy(err)
  })
  ffmpegProcess.stdout.on('data', chunk => { result.push(chunk) })
  ffmpegProcess.stdout.on('error', err => { result.destroy(err) }) 

  // ffmpegProcess.stderr.on('data', chunk => { console.log(chunk.toString('utf8')) }) 

  return result

}

export function ffmpegPcmPeaks(inputRate = 48000, outputRate = 40) {
  let currentFrame: number[] = []
  const frameWidth = Math.floor(inputRate / outputRate)
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      let start = 0 
      let end = Math.min(frameWidth - currentFrame.length, chunk.length)
      for (let f = currentFrame.length; f < chunk.length; f += frameWidth) {
        if (start < end) {
          currentFrame.push(...chunk.subarray(start, end))
        }
        if (currentFrame.length === frameWidth) {
          let max = currentFrame[0]
          let min = currentFrame[0]
          for (let i = 1; i < currentFrame.length; i++) {
            max = Math.max(max, currentFrame[i])
            min = Math.min(min, currentFrame[i])
          }
          this.push(new Uint8Array([ max - min ]))
          currentFrame = []
        }
        start = end
        end = Math.min(end + frameWidth, chunk.length)
      }
      callback()
    }
  })
}
