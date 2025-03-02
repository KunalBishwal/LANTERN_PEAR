import Hyperswarm from 'hyperswarm'
import Hyperbee from 'hyperbee'
import Corestore from 'corestore'
import b4a from 'b4a'

const store = new Corestore(Pear.config.storage)
const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

let core = store.get({ name: 'main-chat' })
let bee = new Hyperbee(core, {
  keyEncoding: 'utf-8',
  valueEncoding: 'json'
})

await bee.ready()

// UI Elements
const peerIdElement = document.getElementById('peerId')
const copyButton = document.getElementById('copyId')
const connectButton = document.getElementById('connectButton')
const remoteIdInput = document.getElementById('remoteIdInput')
const messagesDiv = document.getElementById('messages')
const form = document.getElementById('messageForm')
const input = document.getElementById('messageInput')

// Create a hidden file input if not in HTML
let fileInput = document.getElementById('fileInput')
if (!fileInput) {
  fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.id = 'fileInput'
  fileInput.style.display = 'none'
  document.body.appendChild(fileInput)
}

const updatePeerIdDisplay = () => {
  const peerId = b4a.toString(core.key, 'hex')
  peerIdElement.textContent = `${peerId.slice(0, 4)}...${peerId.slice(-4)}`
}
updatePeerIdDisplay()

copyButton.addEventListener('click', () => {
  const peerId = b4a.toString(core.key, 'hex')
  navigator.clipboard.writeText(peerId)
  copyButton.textContent = '✓ Copied!'
  setTimeout(() => { copyButton.textContent = '📋' }, 2000)
})

connectButton.addEventListener('click', async () => {
  const remoteKey = remoteIdInput.value.trim()
  if (!remoteKey) return alert('Please enter a remote ID.')
  try {
    const remoteCore = store.get({ key: b4a.from(remoteKey, 'hex') })
    const remoteBee = new Hyperbee(remoteCore, {
      keyEncoding: 'utf-8',
      valueEncoding: 'json'
    })
    await remoteBee.ready()
    swarm.join(remoteCore.discoveryKey)
    swarm.on('connection', conn => {
      store.replicate(conn)
      remoteCore.replicate(conn)
    })
    messagesDiv.innerHTML = ''
    remoteBee.createReadStream({ live: true }).on('data', handleMessage)
  } catch (error) {
    console.error('Connection failed:', error)
    alert('Invalid peer ID!')
  }
})

const handleMessage = entry => {
  const isSelf = entry.value.sender === b4a.toString(core.key, 'hex')
  const msg = document.createElement('div')
  msg.className = `message ${isSelf ? 'self' : ''}`
  msg.innerHTML = `
    ${!isSelf ? `<div class="sender">${entry.value.sender.slice(0, 8)}</div>` : ''}
    <div class="text">${entry.value.text}</div>
    <div class="time">${new Date(entry.value.timestamp).toLocaleTimeString()}</div>
  `
  messagesDiv.appendChild(msg)
  messagesDiv.scrollTop = messagesDiv.scrollHeight
}

bee.createReadStream({ live: true }).on('data', handleMessage)

form.addEventListener('submit', async e => {
  e.preventDefault()
  const text = input.value.trim()
  if (!text && !fileToSend) return
  if (text) {
    await bee.put(Date.now().toString(), {
      text,
      sender: b4a.toString(core.key, 'hex'),
      timestamp: Date.now()
    })
    input.value = ''
  }
  if (fileToSend) {
    sendFile()
  }
})

fileInput.addEventListener('change', handleFileSelect)

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (!file) return
  fileToSend = file
  // Optionally, display a preview in your UI or store file name etc.
}

const sendFile = () => {
  if (!fileToSend) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    const base64Data = e.target.result.split(",")[1]
    await bee.put(Date.now().toString(), {
      text: `Sent a file: ${fileToSend.name}`,
      sender: b4a.toString(core.key, 'hex'),
      timestamp: Date.now(),
      file: {
        name: fileToSend.name,
        type: fileToSend.type,
        url: URL.createObjectURL(fileToSend)
      }
    })
    fileToSend = null
    fileInput.value = ''
  }
  reader.readAsDataURL(fileToSend)
}

const base64ToBlob = (base64, mimeType) => {
  const byteCharacters = atob(base64)
  const byteArrays = []
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }
  return new Blob(byteArrays, { type: mimeType })
}

const copyPeerId = () => {
  const peerId = b4a.toString(core.key, 'hex')
  navigator.clipboard.writeText(peerId)
  copyButton.textContent = '✓ Copied!'
  setTimeout(() => { copyButton.textContent = '📋' }, 2000)
}

const clearChatHistory = () => {
  if (window.confirm("Are you sure you want to clear all messages? This cannot be undone.")) {
    messagesDiv.innerHTML = ''
    // Optionally clear your database or keep history as per your requirements
  }
}

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const renderFilePreview = file => {
  if (!file) return null
  if (file.type.startsWith("image/")) {
    const container = document.createElement('div')
    container.className = "relative"
    const img = document.createElement('img')
    img.src = file.url || "/placeholder.svg"
    img.alt = file.name
    img.className = "max-w-full max-h-48 rounded-lg object-contain"
    const label = document.createElement('div')
    label.className = "mt-1 text-xs text-gray-500 dark:text-gray-400"
    label.textContent = file.name
    container.appendChild(img)
    container.appendChild(label)
    return container
  } else if (file.type === "application/pdf") {
    const container = document.createElement('div')
    container.className = "flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg"
    const icon = document.createElement('div')
    icon.innerHTML = `<svg class="h-8 w-8 text-red-500" ...></svg>` // Replace with proper icon if needed
    const textDiv = document.createElement('div')
    textDiv.className = "overflow-hidden"
    const nameDiv = document.createElement('div')
    nameDiv.className = "truncate"
    nameDiv.textContent = file.name
    const link = document.createElement('a')
    link.href = file.url
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    link.className = "text-xs text-blue-500 hover:underline"
    link.textContent = "Open PDF"
    textDiv.appendChild(nameDiv)
    textDiv.appendChild(link)
    container.appendChild(icon)
    container.appendChild(textDiv)
    return container
  } else {
    const container = document.createElement('div')
    container.className = "flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg"
    const icon = document.createElement('div')
    icon.innerHTML = `<svg class="h-8 w-8 text-gray-500" ...></svg>`
    const textDiv = document.createElement('div')
    textDiv.className = "overflow-hidden"
    const nameDiv = document.createElement('div')
    nameDiv.className = "truncate"
    nameDiv.textContent = file.name
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.className = "text-xs text-blue-500 hover:underline"
    link.textContent = "Download"
    textDiv.appendChild(nameDiv)
    textDiv.appendChild(link)
    container.appendChild(icon)
    container.appendChild(textDiv)
    return container
  }
}

const getFileIcon = fileType => {
  if (fileType.startsWith("image/")) return "<svg class='h-4 w-4'>...</svg>"
  if (fileType === "application/pdf") return "<svg class='h-4 w-4'>...</svg>"
  return "<svg class='h-4 w-4'>...</svg>"
}

// Emoji picker
let emojiPickerVisible = false
const toggleEmojiPicker = () => {
  emojiPickerVisible = !emojiPickerVisible
  const picker = document.getElementById('emojiPicker')
  if (picker) {
    picker.style.display = emojiPickerVisible ? 'block' : 'none'
  }
}
const addEmoji = emoji => {
  input.value = input.value + emoji
  setMessageInput(input.value)
  toggleEmojiPicker()
}

// Create a simple emoji picker element if it doesn't exist
let emojiPicker = document.getElementById('emojiPicker')
if (!emojiPicker) {
  emojiPicker = document.createElement('div')
  emojiPicker.id = 'emojiPicker'
  emojiPicker.style.display = 'none'
  emojiPicker.style.position = 'absolute'
  emojiPicker.style.bottom = '100%'
  emojiPicker.style.left = '0'
  emojiPicker.style.background = '#fff'
  emojiPicker.style.border = '1px solid #ccc'
  emojiPicker.style.padding = '8px'
  emojiPicker.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)'
  emojiPicker.style.zIndex = 20
  emojiPicker.style.maxHeight = '200px'
  emojiPicker.style.overflowY = 'auto'
  const grid = document.createElement('div')
  grid.style.display = 'grid'
  grid.style.gridTemplateColumns = 'repeat(8, 1fr)'
  grid.style.gap = '4px'
  emojis.forEach(emoji => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.style.fontSize = '1.5rem'
    btn.textContent = emoji
    btn.addEventListener('click', () => addEmoji(emoji))
    grid.appendChild(btn)
  })
  emojiPicker.appendChild(grid)
  document.body.appendChild(emojiPicker)
}

// Position emoji picker relative to the message input
input.addEventListener('focus', () => {
  const rect = input.getBoundingClientRect()
  emojiPicker.style.top = rect.top - emojiPicker.offsetHeight - 10 + 'px'
  emojiPicker.style.left = rect.left + 'px'
})

// Button for toggling emoji picker
const emojiToggleButton = document.getElementById('emojiToggleButton')
if (emojiToggleButton) {
  emojiToggleButton.addEventListener('click', toggleEmojiPicker)
}
