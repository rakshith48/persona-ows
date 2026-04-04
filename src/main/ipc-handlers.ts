import { IpcMain, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { PythonBridge } from './python-bridge'
import { getOrders, saveOrder, saveMessage, getConversations, getSetting, setSetting } from './db'
import { getWalletInfo, createDeposit } from './wallet'

const PROFILE_PATH = path.join(__dirname, '../../agent/context/profile.json')

const SESSION_ID = crypto.randomUUID()

export function setupIpcHandlers(ipcMain: IpcMain, bridge: PythonBridge) {
  // Send user message to Python agent
  ipcMain.handle('agent:send', async (_event, text: string) => {
    await saveMessage(SESSION_ID, 'user', text)
    bridge.send({ type: 'user_message', text })
  })

  // Respond to approval request
  ipcMain.handle('approval:respond', (_event, requestId: string, approved: boolean) => {
    bridge.send({ type: 'approval_response', request_id: requestId, approved })
  })

  // Proactive: user tapped "Yes, prep it"
  ipcMain.handle('proactive:approve', (_event, text: string) => {
    bridge.send({ type: 'proactive_approve', text })
  })

  // Proactive: user tapped "No thanks"
  ipcMain.handle('proactive:dismiss', () => {
    bridge.send({ type: 'proactive_dismiss' })
  })

  // Wallet
  ipcMain.handle('wallet:getInfo', async () => getWalletInfo())
  ipcMain.handle('wallet:createDeposit', async () => createDeposit())
  ipcMain.handle('wallet:openUrl', (_event, url: string) => shell.openExternal(url))

  // Settings
  ipcMain.handle('settings:get', async (_event, key: string) => getSetting(key))
  ipcMain.handle('settings:set', async (_event, key: string, value: string) => setSetting(key, value))

  // Profile
  ipcMain.handle('profile:get', async () => {
    try {
      return JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf-8'))
    } catch { return {} }
  })
  ipcMain.handle('profile:set', async (_event, profile: Record<string, unknown>) => {
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2))
  })

  // Database
  ipcMain.handle('db:getOrders', async () => getOrders())
  ipcMain.handle('db:getConversations', async () => getConversations(SESSION_ID))

  // Persist agent messages
  bridge.on('message', async (msg: Record<string, unknown>) => {
    if (msg.type === 'agent_text' && typeof msg.text === 'string') {
      await saveMessage(SESSION_ID, 'agent', msg.text)
    }
    if (msg.type === 'order_update' && msg.order) {
      const order = msg.order as { id: string; item_name: string; price: number; merchant: string; status?: string }
      await saveOrder(order)
    }
  })
}
