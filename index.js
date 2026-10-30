const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const readline = require('readline')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('session')
  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['KESABI-MD', 'Chrome', '1.0.0']
  })

  if(!sock.authState.creds.registered) {
    const phoneNumber = await question('Enter your bot number with country code (e.g 2760...): ')
    const code = await sock.requestPairingCode(phoneNumber)
    console.log('YOUR PAIRING CODE: ' + code)
    console.log('Go to WhatsApp > Linked Devices > Link with phone number > Enter this code')
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (u) => {
    if(u.connection === 'open') {
      console.log('KESABI-MD CONNECTED ✅')
      rl.close()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if(!m.message) return
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
    const from = m.key.remoteJid

    if(text.toLowerCase() === '.ping') {
      await sock.sendMessage(from, { text: '*Pong!*\nKESABI-MD is alive ⚡' })
    }
    if(text.toLowerCase() === '.menu') {
      await sock.sendMessage(from, { text: 
`*KESABI-MD MENU*
Owner: Kesabi

.ping - check bot speed
.menu - this menu
.owner - bot owner
.sticker - reply to image to make sticker
.hi - say hi

More commands coming soon...` })
    }
    if(text.toLowerCase() === '.owner') {
      await sock.sendMessage(from, { text: 'My owner is Kesabi 👑' })
    }
    if(text.toLowerCase() === '.hi') {
      await sock.sendMessage(from, { text: 'Hello! I am KESABI-MD Bot 🤖' })
    }
  })
}
start()