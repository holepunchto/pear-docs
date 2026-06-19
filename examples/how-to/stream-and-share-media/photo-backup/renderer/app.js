const bridge = window.bridge
const decoder = new TextDecoder('utf-8')

const SPECIFIER = '/workers/index.js'

const countEl = document.getElementById('count')
const dropzoneEl = document.getElementById('dropzone')
const fileInputEl = document.getElementById('fileInput')
const emptyEl = document.getElementById('empty')
const galleryEl = document.getElementById('gallery')
const playerEl = document.getElementById('player')
const playerMediaEl = document.getElementById('playerMedia')
const backEl = document.getElementById('back')
const formEl = document.getElementById('composer')
const inputEl = document.getElementById('input')
const sendEl = document.getElementById('send')
const commentsEl = document.getElementById('comments')
const inviteBarEl = document.getElementById('invite-bar')
const inviteEl = document.getElementById('invite')
const copyEl = document.getElementById('copy')

let invite = ''

function setInvite (value) {
  invite = value
  if (!invite) {
    inviteBarEl.classList.add('hidden')
    return
  }
  inviteEl.textContent = invite
  inviteBarEl.classList.remove('hidden')
}

copyEl.addEventListener('click', () => {
  if (!invite) return
  bridge.writeClipboard(invite)
  copyEl.textContent = 'Copied'
  setTimeout(() => { copyEl.textContent = 'Copy' }, 1500)
})

let videos = []
let messages = []
let playerId = null

function addFile (file) {
  const filePath = bridge.getPathForFile(file)
  bridge.writeWorkerIPC(SPECIFIER, JSON.stringify({ type: 'add-video', path: filePath }))
}

function showGallery () {
  playerEl.classList.add('hidden')
  dropzoneEl.classList.remove('hidden')
  emptyEl.style.display = videos.length === 0 ? '' : 'none'
  galleryEl.style.display = videos.length === 0 ? 'none' : ''
}

function showPlayer () {
  dropzoneEl.classList.add('hidden')
  emptyEl.style.display = 'none'
  galleryEl.style.display = 'none'
  playerEl.classList.remove('hidden')
}

function render () {
  countEl.textContent = `${videos.length} item${videos.length === 1 ? '' : 's'}`

  if (playerId && !videos.find((v) => v.id === playerId)) playerId = null

  if (playerId) {
    renderPlayer()
    showPlayer()
  } else {
    renderGallery()
    showGallery()
  }
}

function renderGallery () {
  galleryEl.replaceChildren()
  for (const video of videos) {
    const button = document.createElement('button')
    button.className = 'aspect-square overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 hover:border-neutral-600 transition group'
    button.addEventListener('click', () => {
      playerId = video.id
      render()
    })

    let media
    if (video.type.startsWith('image/')) {
      media = document.createElement('img')
      media.src = video.info.preview || video.info.link
      media.alt = video.name
      media.loading = 'lazy'
      media.className = 'h-full w-full object-cover group-hover:scale-105 transition-transform'
    } else {
      media = document.createElement('video')
      media.src = video.info.link
      media.muted = true
      media.preload = 'metadata'
      media.className = 'h-full w-full object-cover'
    }

    button.append(media)
    galleryEl.append(button)
  }
}

function renderPlayer () {
  const video = videos.find((v) => v.id === playerId)
  if (!video) return

  playerMediaEl.replaceChildren()
  let media
  if (video.type.startsWith('image/')) {
    media = document.createElement('img')
    media.src = video.info.link
    media.alt = video.name
    media.className = 'w-full'
  } else {
    media = document.createElement('video')
    media.src = video.info.link
    media.controls = true
    media.autoplay = true
    media.className = 'w-full bg-black'
  }
  playerMediaEl.append(media)

  const comments = messages.filter((msg) => msg.info?.videoId === video.id)

  commentsEl.replaceChildren()
  const heading = document.createElement('div')
  heading.className = 'text-xs text-neutral-500'
  heading.textContent = `${comments.length} comment${comments.length === 1 ? '' : 's'}`
  commentsEl.append(heading)

  for (const msg of comments) {
    const item = document.createElement('div')
    item.className = 'rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3'

    const meta = document.createElement('div')
    meta.className = 'mb-1 flex items-baseline gap-2'

    const name = document.createElement('span')
    name.className = 'text-sm font-medium text-neutral-200'
    name.textContent = msg.info?.name ?? 'unknown'

    const time = document.createElement('span')
    time.className = 'text-xs text-neutral-500'
    time.textContent = new Date(msg.info?.at).toLocaleTimeString()

    meta.append(name, time)

    const text = document.createElement('p')
    text.className = 'text-sm text-neutral-100 break-words'
    text.textContent = msg.text

    item.append(meta, text)
    commentsEl.append(item)
  }
}

dropzoneEl.addEventListener('dragover', (event) => {
  event.preventDefault()
  dropzoneEl.classList.add('border-neutral-600', 'bg-neutral-900')
})

dropzoneEl.addEventListener('dragleave', () => {
  dropzoneEl.classList.remove('border-neutral-600', 'bg-neutral-900')
})

dropzoneEl.addEventListener('drop', (event) => {
  event.preventDefault()
  dropzoneEl.classList.remove('border-neutral-600', 'bg-neutral-900')
  for (const file of event.dataTransfer.files) addFile(file)
})

fileInputEl.addEventListener('change', (event) => {
  for (const file of event.target.files) addFile(file)
  fileInputEl.value = ''
})

backEl.addEventListener('click', () => {
  playerId = null
  render()
})

inputEl.addEventListener('input', () => {
  sendEl.disabled = inputEl.value.trim() === ''
})

formEl.addEventListener('submit', (event) => {
  event.preventDefault()
  const text = inputEl.value.trim()
  if (!text || !playerId) return
  bridge.writeWorkerIPC(SPECIFIER, JSON.stringify({ type: 'add-message', text, info: { videoId: playerId } }))
  inputEl.value = ''
  sendEl.disabled = true
})

bridge.startWorker(SPECIFIER)

const offWorkerIPC = bridge.onWorkerIPC(SPECIFIER, (data) => {
  let message
  try {
    message = JSON.parse(decoder.decode(data))
  } catch {
    return
  }
  if (message.type === 'videos') {
    videos = message.videos
    render()
  } else if (message.type === 'messages') {
    messages = message.messages
    render()
  } else if (message.type === 'invite') {
    setInvite(message.invite)
  }
})

const offWorkerExit = bridge.onWorkerExit(SPECIFIER, (code) => {
  console.log('worker exited with code', code)
  offWorkerIPC()
  offWorkerExit()
})

render()
