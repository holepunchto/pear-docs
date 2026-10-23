const log = document.getElementById('log')
const peers = document.getElementById('peers')
const input = document.getElementById('input')

const fromColor = {
  system: 'text-zinc-500 italic',
  you: 'text-emerald-400 font-medium',
  peer: 'text-sky-400 font-medium'
}

function append(from, text) {
  const row = document.createElement('div')
  row.className = 'flex gap-2 items-baseline'

  const fromEl = document.createElement('span')
  fromEl.className = fromColor[from] ?? fromColor.peer
  fromEl.textContent = from + ':'

  const textEl = document.createElement('span')
  textEl.textContent = text

  row.append(fromEl, textEl)
  log.appendChild(row)
  log.scrollTop = log.scrollHeight // keep latest line visible
}

// JSON lines from the worker, forwarded by preload → main → here
window.chat.onMessage((event) => {
  if (event.type === 'peers') peers.textContent = event.count
  else if (event.type === 'message') append(event.from, event.text)
  else if (event.type === 'ready') append('system', 'connected to swarm')
})

input.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || !input.value) return
  const text = input.value
  input.value = ''
  append('you', text)
  window.chat.send(text) // preload → main → worker Bare.IPC
})
