import { execFile, execFileSync } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import https from 'https'
import http from 'http'

const execFileAsync = promisify(execFile)

const WALLET_NAME = process.env.OWS_WALLET_NAME || 'persona-agent'
const USDC_RPC_URL = process.env.USDC_RPC_URL || 'https://mainnet.base.org'
const USDC_CONTRACT = process.env.USDC_CONTRACT || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

function findOwsBin(): string {
  try {
    const result = execFileSync('/bin/sh', ['-lc', 'which ows'], {
      encoding: 'utf-8',
      timeout: 5000,
    })
    const found = result.trim()
    if (found && fs.existsSync(found)) return found
  } catch {}

  const home = process.env.HOME || ''
  for (const c of [
    path.join(home, '.npm-global/bin/ows'),
    '/usr/local/bin/ows',
    '/opt/homebrew/bin/ows',
  ]) {
    if (fs.existsSync(c)) return c
  }
  return 'ows'
}

const OWS_BIN = findOwsBin()
console.log('[wallet] OWS_BIN:', OWS_BIN)

/** Run ows CLI, return combined output even on non-zero exit */
async function runOws(args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync(OWS_BIN, args, { timeout: 30000 })
    return (stdout + '\n' + stderr).trim()
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string }
    const output = ((e.stdout || '') + '\n' + (e.stderr || '')).trim()
    if (output) return output
    throw err
  }
}

/** Get wallet EVM address from OWS (no MoonPay, no rate limits) */
async function getWalletAddress(): Promise<string> {
  try {
    const text = await runOws(['wallet', 'list'])
    // Find the ethereum line: "eip155:1 (ethereum) → 0x342C..."
    const match = text.match(/eip155:\d+\s+\(ethereum\)\s+→\s+(0x[a-fA-F0-9]{40})/)
    if (match) return match[1]
    // Fallback: any 0x address
    const fallback = text.match(/0x[a-fA-F0-9]{40}/)
    return fallback?.[0] || ''
  } catch {
    return ''
  }
}

/** Check USDC balance directly via Base RPC (no MoonPay, no rate limits) */
async function getUsdcBalance(address: string): Promise<number> {
  if (!address) return 0

  const addrPadded = address.slice(2).toLowerCase().padStart(64, '0')
  const callData = `0x70a08231${addrPadded}`

  const body = JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [{ to: USDC_CONTRACT, data: callData }, 'latest'],
    id: 1,
  })

  return new Promise((resolve) => {
    const url = new URL(USDC_RPC_URL)
    const mod = url.protocol === 'https:' ? https : http
    const req = mod.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const result = JSON.parse(data).result || '0x0'
          resolve(parseInt(result, 16) / 1_000_000)
        } catch { resolve(0) }
      })
    })
    req.on('error', () => resolve(0))
    req.setTimeout(10000, () => { req.destroy(); resolve(0) })
    req.write(body)
    req.end()
  })
}

// Cache the address so we don't call ows CLI repeatedly
let cachedAddress = ''

export interface WalletInfo {
  address: string
  balance: number
}

export interface DepositInfo {
  depositUrl: string
  addresses: Record<string, string>
}

export async function getWalletInfo(): Promise<WalletInfo> {
  try {
    if (!cachedAddress) {
      cachedAddress = await getWalletAddress()
      console.log('[wallet] address:', cachedAddress)
    }
    const balance = await getUsdcBalance(cachedAddress)
    return { address: cachedAddress, balance }
  } catch (err) {
    console.error('[wallet] getWalletInfo error:', err)
    return { address: cachedAddress, balance: 0 }
  }
}

export async function createDeposit(): Promise<DepositInfo> {
  try {
    console.log('[wallet] creating deposit...')
    const text = await runOws(['fund', 'deposit', '--wallet', WALLET_NAME, '--chain', 'base', '--token', 'USDC'])
    console.log('[wallet] deposit output:', text.slice(0, 300))

    const addresses: Record<string, string> = {}
    for (const chain of ['bitcoin', 'solana', 'ethereum', 'tron']) {
      const match = text.match(new RegExp(`${chain}\\s+(\\S+)`))
      if (match) addresses[chain] = match[1]
    }

    const urlMatch = text.match(/(https:\/\/moonpay[^\s]+)/)
    const depositUrl = urlMatch?.[1] || ''

    console.log('[wallet] addresses:', Object.keys(addresses), 'url:', !!depositUrl)
    return { depositUrl, addresses }
  } catch (err) {
    console.error('[wallet] createDeposit error:', err)
    return { depositUrl: '', addresses: {} }
  }
}
