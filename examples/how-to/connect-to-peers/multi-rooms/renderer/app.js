const bridge = window.bridge
const decoder = new TextDecoder('utf-8')

const SPECIFIER = '/workers/index.js'

const roomsEl = document.getElementById('rooms')
const roomsEmptyEl = document.getElementById('rooms-empty')
const createRoomEl = document.getElementById('create-room')
const roomNameEl = document.getElementById('room-name')
const joinRoomEl = document.getElementById('join-room')
const roomInviteEl = document.getElementById('room-invite')

const noRoomEl = document.getElementById('no-room')
const roomViewEl = document.getElementById('room-view')
const roomTitleEl = document.getElementById('room-title')
const roomInviteLabelEl = document.getElementById('room-invite-label')
const copyInviteEl = document.getElementById('copy-invite')

const messagesEl = document.getElementById('messages')
const messagesEmptyEl = document.getElementById('messages-empty')
const formEl = document.getElementById('composer')
const inputEl = document.getElementById('input')
const sendEl = document.getElementById('send')

let rooms = []
const messagesByRoom = {}
let selectedRoomId = null

function activeRoomId () {
  if (selectedRoomId && rooms.some((room) => room.id === selectedRoomId)) return selectedRoomId
  return rooms[0]?.id ?? null
}

function renderRooms () {
  roomsEmptyEl.style.display = rooms.length === 0 ? '' : 'none'

  for (const node of [...roomsEl.children]) {
    if (node !== roomsEmptyEl) node.remove()
  }

  const roomId = activeRoomId()
  for (const room of rooms) {
    const button = document.createElement('button')
    button.type = 'button'
    const isActive = room.id === roomId
    button.className = `w-full text-left rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-900'}`

    const name = document.createElement('div')
    name.className = 'truncate font-medium'
    name.textContent = room.name

    button.append(name)
    button.addEventListener('click', () => {
      selectedRoomId = room.id
      render()
    })
    roomsEl.append(button)
  }
}

function renderMessages () {
  const roomId = activeRoomId()
  const messages = (roomId && messagesByRoom[roomId]) || []

  for (const node of [...messagesEl.children]) {
    if (node !== messagesEmptyEl) node.remove()
  }
  messagesEmptyEl.style.display = messages.length === 0 ? '' : 'none'

  for (const message of messages) {
    const item = document.createElement('div')
    item.className = 'rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3'

    const meta = document.createElement('div')
    meta.className = 'mb-1 flex items-baseline gap-2'

    const name = document.createElement('span')
    name.className = 'text-sm font-medium text-neutral-200'
    name.textContent = message.info?.name ?? 'unknown'

    const time = document.createElement('span')
    time.className = 'text-xs text-neutral-500'
    time.textContent = new Date(message.info?.at).toLocaleTimeString()

    meta.append(name, time)

    const text = document.createElement('p')
    text.className = 'text-sm text-neutral-100 break-words whitespace-pre-wrap'
    text.textContent = message.text

    item.append(meta, text)
    messagesEl.append(item)
  }

  messagesEl.scrollTop = messagesEl.scrollHeight
}

function render () {
  const roomId = activeRoomId()
  const room = rooms.find((r) => r.id === roomId)

  renderRooms()

  if (!room) {
    noRoomEl.style.display = ''
    roomViewEl.style.display = 'none'
    return
  }

  noRoomEl.style.display = 'none'
  roomViewEl.style.display = ''
  roomTitleEl.textContent = room.name
  roomInviteLabelEl.textContent = room.invite ?? ''
  copyInviteEl.disabled = !room.invite
  renderMessages()
}

copyInviteEl.addEventListener('click', () => {
  const invite = roomInviteLabelEl.textContent.trim()
  if (!invite) return
  bridge.writeClipboard(invite)
  copyInviteEl.textContent = 'Copied!'
  setTimeout(() => { copyInviteEl.textContent = 'Copy invite' }, 1500)
})

createRoomEl.addEventListener('submit', (event) => {
  event.preventDefault()
  const name = roomNameEl.value.trim()
  if (!name) return
  bridge.writeWorkerIPC(SPECIFIER, JSON.stringify({ type: 'add-room', name }))
  roomNameEl.value = ''
})

joinRoomEl.addEventListener('submit', (event) => {
  event.preventDefault()
  const invite = roomInviteEl.value.trim()
  if (!invite) return
  bridge.writeWorkerIPC(SPECIFIER, JSON.stringify({ type: 'join-room', invite }))
  roomInviteEl.value = ''
})

inputEl.addEventListener('input', () => {
  sendEl.disabled = inputEl.value.trim() === ''
})

formEl.addEventListener('submit', (event) => {
  event.preventDefault()
  const text = inputEl.value.trim()
  const roomId = activeRoomId()
  if (!text || !roomId) return
  bridge.writeWorkerIPC(SPECIFIER, JSON.stringify({ type: 'add-message', text, roomId }))
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
  if (message.type === 'rooms') {
    rooms = message.rooms
    render()
  } else if (message.type === 'messages') {
    messagesByRoom[message.roomId] = message.messages
    render()
  }
})

const offWorkerExit = bridge.onWorkerExit(SPECIFIER, (code) => {
  console.log('worker exited with code', code)
  offWorkerIPC()
  offWorkerExit()
})
