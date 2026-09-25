const bridge = window.bridge
const decoder = new TextDecoder('utf-8')

const SPECIFIER = '/workers/index.js'

// Frame kinds shared with the worker: small JSON control/event frames are
// tagged 0x00, raw WebM video fragments are tagged 0x01 so they travel as
// bytes instead of bloated JSON arrays.
const KIND_JSON = 0x00
const KIND_FRAGMENT = 0x01

// WebM/VP8 is the only format Chromium's MediaRecorder reliably encodes today.
// MP4/H.264 reports isTypeSupported=true but emits empty chunks.
const RECORDER_MIME = 'video/webm; codecs="vp8"'
const TIMESLICE_MS = 1000

const roleEl = document.getElementById('role')
const recordingEl = document.getElementById('recording')
const inviteBarEl = document.getElementById('invite-bar')
const inviteEl = document.getElementById('invite')
const copyEl = document.getElementById('copy')
const captureErrorEl = document.getElementById('capture-error')
const previewEl = document.getElementById('preview')
const playerEl = document.getElementById('player')
const messagesEl = document.getElementById('messages')
const emptyEl = document.getElementById('empty')
const countEl = document.getElementById('count')
const formEl = document.getElementById('composer')
const inputEl = document.getElementById('input')
const sendEl = document.getElementById('send')

let role = null
let invite = ''
let videos = []
let captureStarted = false

function sendFragment (bytes) {
  const frame = new Uint8Array(bytes.length + 1)
  frame[0] = KIND_FRAGMENT
  frame.set(bytes, 1)
  bridge.writeWorkerIPC(SPECIFIER, frame)
}

function sendControl (message) {
  const body = new TextEncoder().encode(JSON.stringify(message))
  const frame = new Uint8Array(body.length + 1)
  frame[0] = KIND_JSON
  frame.set(body, 1)
  bridge.writeWorkerIPC(SPECIFIER, frame)
}

function setRole (value) {
  role = value
  if (!role) {
    roleEl.classList.add('hidden')
    return
  }
  roleEl.textContent = role
  roleEl.classList.remove('hidden')
  if (role === 'creator') startCapture()
}

function setInvite (value) {
  invite = value
  if (!invite) {
    inviteBarEl.classList.add('hidden')
    return
  }
  inviteEl.textContent = invite
  inviteBarEl.classList.remove('hidden')
}

function setCaptureError (message) {
  if (!message) {
    captureErrorEl.classList.add('hidden')
    return
  }
  captureErrorEl.textContent = 'Capture failed: ' + message
  captureErrorEl.classList.remove('hidden')
  recordingEl.classList.add('hidden')
}

function renderMessages (messages) {
  countEl.textContent = String(messages.length)

  for (const node of [...messagesEl.children]) {
    if (node !== emptyEl) node.remove()
  }
  emptyEl.style.display = messages.length === 0 ? '' : 'none'

  for (const message of messages) {
    const item = document.createElement('div')
    item.className = 'rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2'

    const meta = document.createElement('div')
    meta.className = 'flex items-baseline gap-2'

    const name = document.createElement('span')
    name.className = 'text-sm font-medium text-neutral-200'
    name.textContent = message.info?.name ?? 'unknown'

    const time = document.createElement('span')
    time.className = 'text-xs text-neutral-500'
    time.textContent = new Date(message.info?.at).toLocaleTimeString()

    meta.append(name, time)

    const text = document.createElement('p')
    text.className = 'text-sm text-neutral-100 break-words'
    text.textContent = message.text

    item.append(meta, text)
    messagesEl.append(item)
  }
}

// Capture: only the creator records and uploads fragments to the autobase.
async function startCapture () {
  if (captureStarted) return
  captureStarted = true
  let stream
  try {
    if (!window.MediaRecorder || !window.MediaRecorder.isTypeSupported(RECORDER_MIME)) {
      throw new Error('MediaRecorder does not support ' + RECORDER_MIME)
    }
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    // Hidden preview keeps Chromium pumping frames into the stream.
    previewEl.srcObject = stream
    previewEl.play().catch(() => {})
    recordingEl.classList.remove('hidden')

    const recorder = new window.MediaRecorder(stream, { mimeType: RECORDER_MIME })
    let firstUpload = false
    recorder.ondataavailable = async (e) => {
      if (!e.data || e.data.size === 0) return
      if (!firstUpload) {
        console.log('[live-cam] first chunk encoded, ' + e.data.size + ' bytes')
        firstUpload = true
      }
      const buf = new Uint8Array(await e.data.arrayBuffer())
      sendFragment(buf)
    }
    recorder.onerror = (e) => {
      console.error('[live-cam] recorder error:', e?.error?.message || e)
      setCaptureError(e?.error?.message || 'recorder error')
    }
    recorder.start(TIMESLICE_MS)
  } catch (err) {
    console.error('[live-cam] capture error:', err.message)
    setCaptureError(err.message)
  }
}

// Playback: append replicated fragments to the MediaSource strictly in
// fragIdx order. WebM/VP8 is a single continuous stream, so a gap or an
// out-of-order append puts the <video> element into a permanent error state
// (video.error becomes non-null and every later appendBuffer throws).
//
// The autobase log persists across restarts, so it can hold several recordings
// whose fragIdx both start at 0. Each is tagged with a unique info.session; we
// lock onto the newest session and only ever append that session's fragments.
function startPlayback () {
  const video = playerEl
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const latestSession = () => {
    let latest = null
    for (const f of videos) {
      const s = f?.info?.session
      if (s != null && (latest === null || s > latest)) latest = s
    }
    return latest
  }

  // Stream a single session into a fresh MediaSource. Resolves when playback
  // stops or a newer session appears, so the outer loop can rebuild for it.
  const playSession = (session) => new Promise((resolve) => {
    const mediaSource = new window.MediaSource()
    video.src = URL.createObjectURL(mediaSource)

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }

    mediaSource.addEventListener('sourceopen', async () => {
      if (!window.MediaSource.isTypeSupported(RECORDER_MIME)) {
        console.error('[playback] MediaSource cannot decode ' + RECORDER_MIME)
        finish()
        return
      }
      const sb = mediaSource.addSourceBuffer(RECORDER_MIME)
      sb.addEventListener('error', () => console.error('[playback] SourceBuffer error'))

      // Locate the fragment at exactly `fragIdx` within the active session.
      // Replication can deliver records out of array order, so match on the
      // tagged session + fragIdx rather than indexing by array position.
      const findFragment = (idx) =>
        videos.find(f => f?.info?.session === session && f?.info?.fragIdx === idx)

      let fragIdx = 0
      while (!settled) {
        // A newer recording started (creator restarted): tear down and let the
        // outer loop rebuild a MediaSource for the newer session.
        if (latestSession() > session) {
          finish()
          return
        }
        // The element has entered a terminal decode error: appending more would
        // only re-throw forever. Stop instead of hammering it.
        if (video.error) {
          console.error('[playback] video element errored, stopping:', video.error.message)
          finish()
          return
        }
        const fragment = findFragment(fragIdx)
        if (!fragment) {
          // Wait for the next fragment to replicate in (in order).
          await delay(100)
          continue
        }
        try {
          const res = await fetch(fragment.info.link)
          if (!res.ok) throw new Error('fetch ' + res.status)
          const data = await res.arrayBuffer()
          if (data.byteLength === 0) throw new Error('empty fragment')
          if (mediaSource.readyState !== 'open') {
            finish()
            return
          }
          sb.appendBuffer(data)
          await new Promise((resolve, reject) => {
            const onDone = () => { cleanup(); resolve() }
            const onErr = () => { cleanup(); reject(new Error('append failed')) }
            const cleanup = () => {
              sb.removeEventListener('updateend', onDone)
              sb.removeEventListener('error', onErr)
            }
            sb.addEventListener('updateend', onDone, { once: true })
            sb.addEventListener('error', onErr, { once: true })
          })
          video.play().catch(() => {})
          fragIdx += 1
        } catch (err) {
          // Do not retry the same fragment against a dead MediaSource; a decode
          // failure here is terminal for this <video>, so surface it and bail.
          console.error('[playback] fragment ' + fragIdx + ' failed:', err.message)
          finish()
          return
        }
      }
      finish()
    })
  })

  ;(async () => {
    while (true) {
      const session = latestSession()
      if (session === null) {
        await delay(100)
        continue
      }
      await playSession(session)
    }
  })()
}

inputEl.addEventListener('input', () => {
  sendEl.disabled = inputEl.value.trim() === ''
})

formEl.addEventListener('submit', (event) => {
  event.preventDefault()
  const text = inputEl.value.trim()
  if (!text) return
  sendControl({ type: 'add-message', text })
  inputEl.value = ''
  sendEl.disabled = true
})

copyEl.addEventListener('click', () => {
  if (!invite) return
  bridge.writeClipboard(invite)
  copyEl.textContent = 'Copied'
  setTimeout(() => { copyEl.textContent = 'Copy' }, 1500)
})

bridge.startWorker(SPECIFIER)
startPlayback()

const offWorkerIPC = bridge.onWorkerIPC(SPECIFIER, (data) => {
  if (data[0] !== KIND_JSON) return
  let message
  try {
    message = JSON.parse(decoder.decode(data.subarray(1)))
  } catch {
    return
  }
  if (message.type === 'invite') setInvite(message.invite)
  else if (message.type === 'role') setRole(message.role)
  else if (message.type === 'videos') videos = message.videos
  else if (message.type === 'messages') renderMessages(message.messages)
})

const offWorkerExit = bridge.onWorkerExit(SPECIFIER, (code) => {
  console.log('worker exited with code', code)
  offWorkerIPC()
  offWorkerExit()
})
