import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import dotenv from 'dotenv'
import { PythonBridge } from './python-bridge'
import { setupIpcHandlers } from './ipc-handlers'
import { getDb } from './db'

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

  // Start Python agent bridge
  pythonBridge = new PythonBridge()
  pythonBridge.start()

  // Forward agent messages to renderer
  pythonBridge.on('message', (msg) => {
    mainWindow?.webContents.send('agent:message', msg)
  })

  // Set up IPC handlers (includes DB persistence of messages)
  setupIpcHandlers(ipcMain, pythonBridge)

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
