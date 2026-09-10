const bridge = window.bridge
const decoder = new TextDecoder('utf-8')

const SPECIFIER = '/workers/index.js'

const countEl = document.getElementById('count')
const dropzoneEl = document.getElementById('dropzone')
const fileInputEl = document.getElementById('fileInput')
const drivesEl = document.getElementById('drives')
const emptyEl = document.getElementById('empty')
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

function addFile (file) {
  const uri = bridge.getPathForFile(file)
  bridge.writeWorkerIPC(SPECIFIER, JSON.stringify({ type: 'add-file', name: file.name, uri }))
}

function addFiles (files) {
  for (const file of files) addFile(file)
}

function renderDrives (drives) {
  const totalFiles = drives.reduce((sum, d) => sum + d.info.files.length, 0)
  countEl.textContent =
    `${drives.length} drive${drives.length === 1 ? '' : 's'} · ${totalFiles} file${totalFiles === 1 ? '' : 's'}`

  // Re-render the list from scratch; keep the empty-state element in the DOM.
  for (const node of [...drivesEl.children]) {
    if (node !== emptyEl) node.remove()
  }
  emptyEl.style.display = drives.length === 0 ? '' : 'none'

  for (const drive of drives) {
    const card = document.createElement('div')
    card.className = 'rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3'

    const head = document.createElement('div')
    head.className = 'flex items-center gap-2 mb-2'

    const title = document.createElement('a')
    title.className = 'text-sm font-medium text-neutral-100 hover:text-white hover:underline truncate'
    title.href = drive.info.uri
    title.textContent = drive.info.name

    head.append(title)

    if (drive.info.isMyDrive) {
      const badge = document.createElement('span')
      badge.className = 'rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-400'
      badge.textContent = 'You'
      head.append(badge)
    }

    card.append(head)

    if (drive.info.files.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'text-xs text-neutral-500'
      empty.textContent = 'Empty drive.'
      card.append(empty)
    } else {
      const list = document.createElement('ul')
      list.className = 'space-y-1'
      for (const file of drive.info.files) {
        const item = document.createElement('li')
        item.className = 'text-sm'
        const link = document.createElement('a')
        link.className = 'text-neutral-300 hover:text-neutral-100 hover:underline break-all'
        link.href = file.uri
        link.textContent = file.name
        item.append(link)
        list.append(item)
      }
      card.append(list)
    }

    drivesEl.append(card)
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
  addFiles(event.dataTransfer.files)
})

fileInputEl.addEventListener('change', (event) => {
  addFiles(event.target.files)
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
  if (message.type === 'drives') renderDrives(message.drives)
  if (message.type === 'invite') setInvite(message.invite)
})

const offWorkerExit = bridge.onWorkerExit(SPECIFIER, (code) => {
  console.log('worker exited with code', code)
  offWorkerIPC()
  offWorkerExit()
})
