import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

let db: SqlJsDatabase | null = null
let dbPath = ''

async function initDb(): Promise<SqlJsDatabase> {
  if (db) return db

  const SQL = await initSqlJs()
  dbPath = path.join(app.getPath('userData'), 'persona.db')

  // Load existing DB or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      item_name TEXT NOT NULL,
      price REAL NOT NULL,
      merchant TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      card_id TEXT,
      zinc_order_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      details TEXT
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS gift_cards (
      id TEXT PRIMARY KEY,
      card_number TEXT NOT NULL,
      cvv TEXT NOT NULL,
      expiry TEXT NOT NULL,
      initial_amount REAL NOT NULL,
      remaining_amount REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  return db
}

function persist() {
  if (db && dbPath) {
    const data = db.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
  }
}

// --- Public API (all async since initDb is async) ---

export async function getDb(): Promise<SqlJsDatabase> {
  return initDb()
}

export async function saveOrder(order: {
  id: string; item_name: string; price: number; merchant: string;
  status?: string; details?: string
}) {
  const d = await initDb()
  d.run(
    `INSERT OR REPLACE INTO orders (id, item_name, price, merchant, status, details, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [order.id, order.item_name, order.price, order.merchant, order.status || 'pending', order.details || null]
  )
  persist()
}

export async function getOrders(): Promise<Record<string, unknown>[]> {
  const d = await initDb()
  const stmt = d.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50')
  const results: Record<string, unknown>[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject() as Record<string, unknown>)
  }
  stmt.free()
  return results
}

export async function saveMessage(sessionId: string, role: string, content: string) {
  const d = await initDb()
  d.run('INSERT INTO conversations (session_id, role, content) VALUES (?, ?, ?)', [sessionId, role, content])
  persist()
}

export async function getConversations(sessionId: string): Promise<Record<string, unknown>[]> {
  const d = await initDb()
  const stmt = d.prepare('SELECT * FROM conversations WHERE session_id = ? ORDER BY created_at ASC')
  stmt.bind([sessionId])
  const results: Record<string, unknown>[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject() as Record<string, unknown>)
  }
  stmt.free()
  return results
}

// --- Settings ---

export async function getSetting(key: string): Promise<string | null> {
  const d = await initDb()
  const stmt = d.prepare('SELECT value FROM settings WHERE key = ?')
  stmt.bind([key])
  const result = stmt.step() ? (stmt.getAsObject() as { value: string }).value : null
  stmt.free()
  return result
}

export async function setSetting(key: string, value: string): Promise<void> {
  const d = await initDb()
  d.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
  persist()
}
