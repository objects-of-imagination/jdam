import os from 'os'
import fs from 'fs'
import { resolve, sep } from 'path'
import { request } from 'https'
import { Transform } from 'stream'
import { spawn } from 'child_process'
import Deferred from '../../shared/deferred'
import jdamRoot from '../../shared/jdam_root'

export const MACHINE = os.machine()
export const BIN_DIR = resolve(process.cwd(), 'bin')
export const FFMPEG_DIR = resolve(process.cwd(), 'bin/ffmpeg')
export const OUTPUT_FILE = 'ffmpeg.tar.gz'

type Archs = 'amd64' | 'i686' | 'arm64' | 'armhf' | 'armel'

const getLink = (arch: Archs) => (`https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-${arch}-static.tar.xz`)
let link = getLink('amd64')

switch(MACHINE) {
case 'arm':
case 'arm64':
  link = getLink('arm64')
  break
case 'i686':
  link = getLink('i686')
  break
}

async function downloadFfmpeg() {

  console.log('\x1b[32mdownloading ffmpeg\x1b[0m')

  const downloadDone = new Deferred<boolean>()
  const writeStream = fs.createWriteStream(resolve(BIN_DIR, OUTPUT_FILE))
  writeStream.once('close', () => {
    downloadDone.resolve(true)
  })

  const linkUrl = new URL(link)

  const req = request(linkUrl, res => {
    const totalLength = Number(res.headers['content-length'] ?? 1.0)
    console.log(totalLength)
    let currentProgress = 0
    res.pipe(new Transform({
      transform(chunk, _encoding, callback) {
        currentProgress += chunk.length
        const currentStep = Math.floor((currentProgress / totalLength) * 100)
        process.stdout.write(`\x1b[1G\x1b[0K${currentStep}%`)
        callback(null, chunk)
      }
    })).pipe(writeStream)
  })

  req.end()

  await downloadDone.promise
  process.stdout.write('\n')
  
  console.log('\x1b[32mdownload ffmpeg - done\x1b[0m')
}

async function untarFfmpeg() {

  console.log('\x1b[32muntarring ffmpeg\x1b[0m')

  const untarDone = new Deferred<boolean>()
  const untarProc = spawn('tar', [ 
    '-xvf',
    OUTPUT_FILE
  ], { cwd: BIN_DIR, stdio: [ 'ignore', 'inherit', 'inherit' ] })
  untarProc.on('exit', () => { untarDone.resolve(true) })

  await untarDone.promise
  
  console.log('\x1b[32muntar ffmpeg - done\x1b[0m')

  const dirs = fs.readdirSync(BIN_DIR)
  const untarredDir = dirs.find(d => (/^ffmpeg-/.test(d)))
  if (!untarredDir) {
    throw new Error('could not find untarredDir')
  }

  console.log(`\x1b[32mrenaming ${resolve(BIN_DIR, untarredDir)} to ${FFMPEG_DIR}\x1b[0m`)
  fs.renameSync(resolve(BIN_DIR, untarredDir), FFMPEG_DIR) 
  console.log(`\x1b[32mrenamed ${resolve(BIN_DIR, untarredDir)} to ${FFMPEG_DIR}\x1b[0m`)
}

export async function setup() {

  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true })
  }

  const processPath = resolve(FFMPEG_DIR, 'ffmpeg')

  if (fs.existsSync(processPath)) {
    console.info(`\x1b[33m${processPath} already exists, skpping setup\x1b[0m`)
    return
  }

  const resolvedOutputFile = resolve(BIN_DIR, OUTPUT_FILE)

  if (!fs.existsSync(resolvedOutputFile)) {
    await downloadFfmpeg()
  } else {
    console.info(`\x1b[33mskipping download, found ffmpeg tar at "${resolvedOutputFile}"\x1b[0m`)
  }

  if (!fs.existsSync(resolvedOutputFile)) {
    throw new Error(`${OUTPUT_FILE} was not located at "${resolvedOutputFile}"`)
  }
  await untarFfmpeg()
}

if (process.argv[2] === 'setup') {
  setup()
}

const JDAM_ROOT = jdamRoot(process.cwd(), resolve, fs.existsSync, sep)

export function ffmpeg(args: string[]) {
  const processPath = resolve(JDAM_ROOT, 'ffmpeg/bin/ffmpeg/ffmpeg')
  if (!fs.existsSync(processPath)) {
    throw new Error('ffmpeg binary is not present')
  }
  return spawn(processPath, args)
}
