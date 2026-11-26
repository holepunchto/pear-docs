const bridge = window.bridge
const decoder = new TextDecoder('utf-8')

const SPECIFIER = '/workers/index.js'

const messagesEl = document.getElementById('messages')
const emptyEl = document.getElementById('empty')
const countEl = document.getElementById('count')
const formEl = document.getElementById('composer')
const inputEl = document.getElementById('input')
const sendEl = document.getElementById('send')
const copyEl = document.getElementById('copy-invite')

let invite = null

copyEl.addEventListener('click', () => {
  if (!invite) return
  bridge.writeClipboard(invite)
  copyEl.textContent = 'Copied!'
  setTimeout(() => { copyEl.textContent = 'Copy invite' }, 1500)
})

function renderMessages (messages) {
  countEl.textContent = `${messages.length} message${messages.length === 1 ? '' : 's'}`

  // Re-render the list from scratch; keep the empty-state element in the DOM.
  for (const node of [...messagesEl.children]) {
    if (node !== emptyEl) node.remove()
  }
  emptyEl.style.display = messages.length === 0 ? '' : 'none'

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

inputEl.addEventListener('input', () => {
  sendEl.disabled = inputEl.value.trim() === ''
})

formEl.addEventListener('submit', (event) => {
  event.preventDefault()
  const text = inputEl.value.trim()
  if (!text) return
  bridge.writeWorkerIPC(SPECIFIER, JSON.stringify({ type: 'add-message', text }))
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
  if (message.type === 'messages') renderMessages(message.messages)
  else if (message.type === 'invite') {
    invite = message.invite
    copyEl.disabled = false
  }
})

const offWorkerExit = bridge.onWorkerExit(SPECIFIER, (code) => {
  console.log('worker exited with code', code)
  offWorkerIPC()
  offWorkerExit()
})
