import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = 3001
const DATA_FILE = path.join(__dirname, 'waitlist.json')

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

function readWaitlist(): string[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeWaitlist(emails: string[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(emails, null, 2))
}

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Add email to waitlist
app.post('/api/waitlist', (req, res) => {
  const { email } = req.body

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required.' })
    return
  }

  const normalized = email.trim().toLowerCase()

  if (!isValidEmail(normalized)) {
    res.status(400).json({ error: 'Invalid email address.' })
    return
  }

  const list = readWaitlist()

  if (list.includes(normalized)) {
    res.status(409).json({ error: 'This email is already on the waitlist.' })
    return
  }

  list.push(normalized)
  writeWaitlist(list)

  console.log(`[waitlist] +1 → ${normalized} (total: ${list.length})`)
  res.json({ message: "You're on the list. We'll be in touch.", count: list.length })
})

// Get waitlist count
app.get('/api/waitlist', (_req, res) => {
  const list = readWaitlist()
  res.json({ count: list.length })
})

app.listen(PORT, () => {
  console.log(`[waitlist] Server running on http://localhost:${PORT}`)
})
