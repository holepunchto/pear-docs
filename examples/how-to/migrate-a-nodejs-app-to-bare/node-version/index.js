import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const outFile = path.join(process.cwd(), process.argv[2] || 'status.json')
const status = { runtime: 'node' }

fs.writeFileSync(outFile, JSON.stringify(status))

const saved = JSON.parse(fs.readFileSync(outFile, 'utf8'))
console.log(`wrote status to ${outFile}`)
console.log(`runtime: ${saved.runtime}`)
