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
}

export function ffmpegConvert ({
  inputFormat,
  outputFormat = 's8',
  sampleRate = 48000,
  channels = 2,
  start,
  end,
  codec
}: FfmpegTransformParams) {

  /* default is signed PCM little-endian data */

  const args = [ 
    '-ar', sampleRate, /* set the bit rate */
    '-ac', channels, /* set the number of channels */
    '-f', outputFormat,
    'pipe:1' // write directly to stdout, which we will pipe to outputStream
  ]

  args.unshift('-i', '-') // stdin
  args.unshift('-f', inputFormat) // need to tell the input stream what format to be in

  if (end) {
    args.unshift('-to', `${end}ms`)
  }

  if (start) {
    args.unshift('-ss', `${start}ms`)
  }

  if (codec) {
    args.unshift('-acodec', codec)
  }

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
