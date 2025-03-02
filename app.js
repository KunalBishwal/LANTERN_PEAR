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


const updatePeerIdDisplay = () => {
  const peerId = b4a.toString(core.key, 'hex')
  peerIdElement.textContent = `${peerId.slice(0, 4)}...${peerId.slice(-4)}`
}
updatePeerIdDisplay()


copyButton.addEventListener('click', () => {
  const peerId = b4a.toString(core.key, 'hex')
  navigator.clipboard.writeText(peerId)
  copyButton.textContent = '✓ Copied!'
  setTimeout(() => {
    copyButton.textContent = '📋'
  }, 2000)
})


connectButton.addEventListener('click', async () => {
  const remoteKey = remoteIdInput.value.trim()
  if (!remoteKey) return alert('Please enter a remote ID.')
  try {
    // Create a separate core for the remote peer
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
  if (!text) return
  await bee.put(Date.now().toString(), {
    text,
    sender: b4a.toString(core.key, 'hex'),
    timestamp: Date.now()
  })
  input.value = ''
})
