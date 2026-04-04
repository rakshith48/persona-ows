import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import dotenv from 'dotenv'
import { PythonBridge } from './python-bridge'
import { setupIpcHandlers } from './ipc-handlers'
import { getDb } from './db'
import fs from 'fs'

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') })

let mainWindow: BrowserWindow | null = null
let pythonBridge: PythonBridge | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0a',
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  // Initialize database
  await getDb()

  createWindow()

  // Auto-approve geolocation permission
  mainWindow!.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'geolocation')
  })

  // Start Python agent bridge
  pythonBridge = new PythonBridge()
  pythonBridge.start()

  // Forward agent messages to renderer + log proactive
  pythonBridge.on('message', (msg) => {
    if (msg.type === 'proactive_log') {
      console.log(msg.text)
    }
    mainWindow?.webContents.send('agent:message', msg)
  })

  // Set up IPC handlers (includes DB persistence of messages)
  setupIpcHandlers(ipcMain, pythonBridge)

  // Poll GPS and write to context/location.json for the proactive engine
  const locationFile = path.join(__dirname, '../../agent/context/location.json')
  const pollLocation = () => {
    mainWindow?.webContents.executeJavaScript(`
      new Promise((res) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => res({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, timestamp: Date.now() }),
          (err) => res(null),
          { timeout: 10000, enableHighAccuracy: true }
        )
      })
    `).then((loc: unknown) => {
      if (loc) {
        fs.writeFileSync(locationFile, JSON.stringify(loc, null, 2))
        console.log('[location] updated:', JSON.stringify(loc).slice(0, 60))
      }
    }).catch(() => {})
  }
  // First poll after 5s (wait for renderer), then every 60s
  setTimeout(pollLocation, 5000)
  setInterval(pollLocation, 60000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  pythonBridge?.stop()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
