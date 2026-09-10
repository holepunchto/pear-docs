const bridge = window.bridge
const decoder = new TextDecoder('utf-8')

const SPECIFIER = '/workers/index.js'

const countEl = document.getElementById('count')
const videosEl = document.getElementById('videos')
const emptyEl = document.getElementById('empty')
const dropzoneEl = document.getElementById('dropzone')
const fileInputEl = document.getElementById('fileInput')
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
let draft = ''

function getPathForFile (file) {
  return bridge.getPathForFile(file)
}

function addVideo (filePath) {
  bridge.writeWorkerIPC(SPECIFIER, JSON.stringify({ type: 'add-video', filePath }))
}

function addMessage (text, videoId) {
  bridge.writeWorkerIPC(SPECIFIER, JSON.stringify({ type: 'add-message', text, info: { videoId } }))
}

function onAddFiles (files) {
  for (const file of files) {
    addVideo(getPathForFile(file))
  }
}

function render () {
  countEl.textContent = `${videos.length} video${videos.length === 1 ? '' : 's'}`

  // Re-render the list from scratch; keep the empty-state element in the DOM.
  for (const node of [...videosEl.children]) {
    if (node !== emptyEl) node.remove()
  }
  emptyEl.style.display = videos.length === 0 ? '' : 'none'

  for (const video of videos) {
    const comments = messages.filter((msg) => msg.info?.videoId === video.id)
    const isPlaying = playerId === video.id

    const card = document.createElement('div')
    card.className = 'rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden'

    const head = document.createElement('div')
    head.className = 'flex items-center justify-between px-4 py-3'

    const title = document.createElement('span')
    title.className = 'text-sm text-neutral-200 truncate'
    title.textContent = video.name

    const toggle = document.createElement('button')
    toggle.className = 'rounded-lg bg-neutral-800 text-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-700 transition'
    toggle.textContent = isPlaying ? 'Hide' : 'Play'
    toggle.addEventListener('click', () => {
      playerId = isPlaying ? null : video.id
      render()
    })

    head.append(title, toggle)
    card.append(head)

    if (isPlaying) {
      const body = document.createElement('div')
      body.className = 'border-t border-neutral-800 px-4 py-4 space-y-4'

      const player = document.createElement('video')
      player.className = 'w-full rounded-xl bg-black'
      player.controls = true
      player.autoplay = true
      player.src = video.info.link
      body.append(player)

      const form = document.createElement('form')
      form.className = 'flex gap-2'

      const input = document.createElement('input')
      input.type = 'text'
      input.value = draft
      input.placeholder = 'Type a comment...'
      input.className = 'flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none transition'
      input.addEventListener('input', () => { draft = input.value })

      const send = document.createElement('button')
      send.type = 'submit'
      send.textContent = 'Send'
      send.className = 'rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-30 transition'

      form.addEventListener('submit', (event) => {
        event.preventDefault()
        const text = draft.trim()
        if (!text) return
        addMessage(text, video.id)
        draft = ''
        input.value = ''
      })

      form.append(input, send)
      body.append(form)

      const list = document.createElement('div')
      list.className = 'space-y-2'

      const meta = document.createElement('div')
      meta.className = 'text-xs text-neutral-500'
      meta.textContent = `${comments.length} comment${comments.length === 1 ? '' : 's'}`
      list.append(meta)

      for (const msg of comments) {
        const item = document.createElement('div')
        item.className = 'rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2'

        const itemMeta = document.createElement('div')
        itemMeta.className = 'flex items-baseline gap-2'

        const name = document.createElement('span')
        name.className = 'text-sm font-medium text-neutral-200'
        name.textContent = msg.info?.name ?? 'unknown'

        const time = document.createElement('span')
        time.className = 'text-xs text-neutral-500'
        time.textContent = new Date(msg.info?.at).toLocaleTimeString()

        itemMeta.append(name, time)

        const text = document.createElement('p')
        text.className = 'text-sm text-neutral-100 break-words'
        text.textContent = msg.text

        item.append(itemMeta, text)
        list.append(item)
      }

      body.append(list)
      card.append(body)
    }

    videosEl.append(card)
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
  onAddFiles(event.dataTransfer.files)
})

fileInputEl.addEventListener('change', (event) => {
  onAddFiles(event.target.files)
  event.target.value = ''
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
