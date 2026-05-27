#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const BASE_URL = 'https://docs.pears.com'
const ROOT = path.resolve(__dirname, '..')
const SUMMARY = path.join(ROOT, 'SUMMARY.md')

const HEADER = `# Pear by Holepunch

> Pear is a peer-to-peer runtime, development platform, and deployment system built on Bare — a small, embeddable JavaScript runtime. Applications are identified by \`pear://\` links, loaded from peers over the Hyperswarm DHT, and run on desktop, terminal, and mobile. Pear is not Node.js.

`

const FRONTMATTER_RE = /^\n*---[\s\S]*?---\n/

function parseSummary () {
  const src = fs.readFileSync(SUMMARY, 'utf8')
  const lines = src.split('\n')

  const sections = []
  let current = null

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+)/)
    if (heading) {
      current = { title: heading[1], entries: [] }
      sections.push(current)
      continue
    }

    const entry = line.match(/^\s*\*\s+\[(.+?)\]\((.+?)\)/)
    if (entry && current) {
      const [, title, relPath] = entry
      if (relPath.startsWith('http')) continue
      current.entries.push({ title, relPath: relPath.replace(/^\.\//, '') })
    }
  }

  return sections
}

function toUrl (relPath) {
  return `${BASE_URL}/${relPath.replace(/\.md$/, '')}`
}

function generateIndex (sections) {
  const lines = [HEADER.trimEnd(), '']

  for (const { title, entries } of sections) {
    if (!entries.length) continue
    lines.push(`## ${title}`, '')
    for (const { title: t, relPath } of entries) {
      lines.push(`- [${t}](${toUrl(relPath)})`)
    }
    lines.push('')
  }

  lines.push(`- [Full Docs](${BASE_URL}/llms-full.txt): Complete concatenated documentation.`)
  lines.push('')

  return lines.join('\n')
}

function generateFull (sections) {
  const parts = [`<SYSTEM>This is the full developer documentation for Pear by Holepunch.</SYSTEM>\n\n`]

  for (const { entries } of sections) {
    for (const { relPath } of entries) {
      const abs = path.join(ROOT, relPath)
      if (!fs.existsSync(abs)) continue
      const content = fs.readFileSync(abs, 'utf8').replace(FRONTMATTER_RE, '')
      parts.push(content.trimEnd() + '\n\n')
    }
  }

  return parts.join('')
}

const sections = parseSummary()

const indexOut = path.join(ROOT, 'llms.txt')
fs.writeFileSync(indexOut, generateIndex(sections), 'utf8')
console.log(`wrote ${indexOut}`)

const fullOut = path.join(ROOT, 'llms-full.txt')
fs.writeFileSync(fullOut, generateFull(sections), 'utf8')
console.log(`wrote ${fullOut}`)
