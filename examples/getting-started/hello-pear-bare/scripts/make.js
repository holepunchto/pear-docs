#!/usr/bin/env node
'use strict'
const pkg = require('../package.json')
const fs = require('fs/promises')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const root = path.resolve(__dirname, '..')
const host = process.env.HOST || `${os.platform()}-${os.arch()}`
const supported = new Set([
  'darwin-arm64',
  'darwin-x64',
  'linux-arm64',
  'linux-x64',
  'win32-arm64',
  'win32-x64'
])

if (!supported.has(host)) {
  console.error(`Unsupported platform/arch: ${host}`)
  console.error(
    'Supported targets: darwin-arm64, darwin-x64, linux-arm64, linux-x64, win32-arm64, win32-x64'
  )
  process.exit(1)
}

const isWindows = os.platform() === 'win32'
const out = path.join('.', 'out', 'make')
const appName = pkg.productName || pkg.name
const bin = host.startsWith('win32-') ? appName + '.exe' : appName
const cleanup = []

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.on('exit', (code, signal) => resolve(signal ? 128 + signal : code))
    child.on('error', reject)
  })
}

async function exists(file) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

async function findSigntoolDir() {
  const base = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin'
  const arch = os.arch() === 'arm64' ? 'arm64' : 'x64'

  if (!(await exists(base))) throw new Error(`Windows SDK bin directory not found: ${base}`)

  const versions = (await fs.readdir(base, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d+(\.\d+)*$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))

  for (const version of versions) {
    const candidate = path.join(base, version, arch, 'signtool.exe')
    if (await exists(candidate)) return path.dirname(candidate)
  }

  throw new Error('signtool.exe not found in Windows SDK')
}

async function make() {
  const signFlags = []
  const extraEnv = {}

  if (process.env.WINDOWS_CERT_SHA1) {
    extraEnv.PATH = `${await findSigntoolDir()};${process.env.PATH}`
    signFlags.push('--sign', '--thumbprint', process.env.WINDOWS_CERT_SHA1)
  }

  if (process.env.MAC_CODESIGN_IDENTITY) {
    signFlags.push('--sign', '--hardened-runtime', '--identity', process.env.MAC_CODESIGN_IDENTITY)
  }

  const build = spawn(
    'bare-build',
    ['--standalone', ...signFlags, '--host', host, '--out', out, 'bin.mjs'],
    {
      cwd: root,
      stdio: 'inherit',
      shell: isWindows,
      env: { ...process.env, ...extraEnv }
    }
  )

  const buildExitCode = await waitForExit(build)
  if (buildExitCode !== 0) throw new Error(`bare-build failed with exit code ${buildExitCode}`)

  if (process.env.KEYCHAIN_PROFILE) {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), `${appName}-notarize-`))
    cleanup.push(temp)
    const zip = path.join(temp, `${appName}.zip`)

    const compress = spawn('ditto', ['-c', '-k', '--sequesterRsrc', path.join(out, bin), zip], {
      cwd: root,
      stdio: 'inherit'
    })
    const compressExitCode = await waitForExit(compress)
    if (compressExitCode !== 0) throw new Error(`ditto failed with exit code ${compressExitCode}`)

    const notarize = spawn(
      'xcrun',
      ['notarytool', 'submit', zip, '--keychain-profile', process.env.KEYCHAIN_PROFILE, '--wait'],
      { cwd: root, stdio: 'inherit' }
    )
    const notarizeExitCode = await waitForExit(notarize)
    if (notarizeExitCode !== 0) {
      throw new Error(`notarytool failed with exit code ${notarizeExitCode}`)
    }
  }
}

make()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    for (const dir of cleanup) {
      try {
        await fs.rm(dir, { recursive: true, force: true })
      } catch (err) {
        console.error(`Failed to clean up ${dir}:`, err)
      }
    }
  })
