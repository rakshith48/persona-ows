import { ChildProcess, spawn } from 'child_process'
import { EventEmitter } from 'events'
import path from 'path'
import readline from 'readline'

export interface AgentMessage {
  type: string
  [key: string]: unknown
}

export class PythonBridge extends EventEmitter {
  private process: ChildProcess | null = null
  private rl: readline.Interface | null = null

  start() {
    const agentDir = path.join(__dirname, '../../agent')
    const pythonPath = path.join(agentDir, '.venv/bin/python3')

    this.process = spawn(pythonPath, ['main.py'], {
      cwd: agentDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    })

    // Read stdout line by line (newline-delimited JSON)
    if (this.process.stdout) {
      this.rl = readline.createInterface({ input: this.process.stdout })
      this.rl.on('line', (line) => {
        try {
          const msg: AgentMessage = JSON.parse(line)
          this.emit('message', msg)
        } catch {
          // Non-JSON output from Python (debug logs etc)
          console.log('[python]', line)
        }
      })
    }

    // Log stderr
    this.process.stderr?.on('data', (data) => {
      console.error('[python:err]', data.toString())
    })

    this.process.on('exit', (code) => {
      console.log(`[python] exited with code ${code}`)
      this.emit('exit', code)
    })
  }

  send(msg: AgentMessage) {
    if (this.process?.stdin?.writable) {
      this.process.stdin.write(JSON.stringify(msg) + '\n')
    }
  }

  stop() {
    this.rl?.close()
    this.process?.kill()
    this.process = null
  }
}
