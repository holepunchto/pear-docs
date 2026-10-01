const { readFileSync } = require('node:fs')
const { parse } = require('pear-changelog')

for (const [version] of parse(readFileSync('CHANGELOG.md'))) {
  console.log('release:', version)
}
