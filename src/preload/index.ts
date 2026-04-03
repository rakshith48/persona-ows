import { contextBridge, ipcRenderer } from 'electron'

export interface WalletInfo {
  address: string
  balance: number
}

export interface DepositInfo {
  depositUrl: string
  addresses: Record<string, string>
}

export interface PersonaAPI {
  sendMessage: (text: string) => Promise<void>
  onAgentMessage: (cb: (msg: Record<string, unknown>) => void) => () => void
  respondToApproval: (requestId: string, approved: boolean) => Promise<void>
  getWalletInfo: () => Promise<WalletInfo>
  createDeposit: () => Promise<DepositInfo>
  openUrl: (url: string) => Promise<void>
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
  getOrders: () => Promise<unknown[]>
  getConversations: () => Promise<unknown[]>
}

contextBridge.exposeInMainWorld('persona', {
  sendMessage: (text: string) => ipcRenderer.invoke('agent:send', text),

  onAgentMessage: (cb: (msg: Record<string, unknown>) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, msg: Record<string, unknown>) => cb(msg)
    ipcRenderer.on('agent:message', handler)
    return () => ipcRenderer.removeListener('agent:message', handler)
  },

  respondToApproval: (requestId: string, approved: boolean) =>
    ipcRenderer.invoke('approval:respond', requestId, approved),

  getWalletInfo: () => ipcRenderer.invoke('wallet:getInfo'),
  createDeposit: () => ipcRenderer.invoke('wallet:createDeposit'),
  openUrl: (url: string) => ipcRenderer.invoke('wallet:openUrl', url),

  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),

  getOrders: () => ipcRenderer.invoke('db:getOrders'),
  getConversations: () => ipcRenderer.invoke('db:getConversations'),
} satisfies PersonaAPI)
