import os from 'os'
import { spawn } from 'child_process'
import { resolve } from 'path'
import fs from 'fs'
import Deferred from '../../shared/deferred'

const MACHINE = os.machine()
const BIN_DIR = resolve(process.cwd(), 'bin')
const FFMPEG_DIR = resolve(process.cwd(), 'bin/ffmpeg')
const OUTPUT_FILE = 'ffmpeg.tar.gz'

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

if (!fs.existsSync(BIN_DIR)) {
  fs.mkdirSync(BIN_DIR, { recursive: true })
}

async function downloadFfmpeg() {

  console.log('\x1b[32mdownloading ffmpeg\x1b[0m')

  const downloadDone = new Deferred<boolean>()
  const downloadProc = spawn('wget', [ 
    '-O',
    OUTPUT_FILE,
    link 
  ], { cwd: BIN_DIR, stdio: [ 'ignore', 'inherit', 'inherit' ] })
  downloadProc.on('exit', () => { downloadDone.resolve(true) })

  await downloadDone.promise
  
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
    console.error('could not find untarredDir')
    process.exit(1)
  }

  console.log(`\x1b[32mrenaming ${resolve(BIN_DIR, untarredDir)} to ${FFMPEG_DIR}\x1b[0m`)
  fs.renameSync(resolve(BIN_DIR, untarredDir), FFMPEG_DIR) 
  console.log(`\x1b[32mrenamed ${resolve(BIN_DIR, untarredDir)} to ${FFMPEG_DIR}\x1b[0m`)
}

async function setup() {
  const processPath = resolve(FFMPEG_DIR, 'ffmpeg')
  if (fs.existsSync(processPath)) {
    console.info(`\x1b[33m${processPath} already exists, skpping setup\x1b[0m`)
    process.exit(0)
  }

  const resolvedOutputFile = resolve(BIN_DIR, OUTPUT_FILE)

  if (!fs.existsSync(resolvedOutputFile)) {
    await downloadFfmpeg()
  } else {
    console.info(`\x1b[33mskipping download, found ffmpeg tar at "${resolvedOutputFile}"\x1b[0m`)
  }

  if (!fs.existsSync(resolvedOutputFile)) {
    console.error(`${OUTPUT_FILE} was not located at "${resolvedOutputFile}"`)
    process.exit(1)
  }
  await untarFfmpeg()
}

setup()
