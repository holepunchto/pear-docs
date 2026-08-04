import fs from 'bare-fs'
import path from 'bare-path'
import process from 'bare-process'

const outFile = path.join(process.cwd(), 'status.json')
const status = { runtime: 'bare' }

fs.writeFileSync(outFile, JSON.stringify(status))

const saved = JSON.parse(fs.readFileSync(outFile, 'utf8'))
console.log(`wrote status to ${outFile}`)
console.log(`runtime: ${saved.runtime}`)
