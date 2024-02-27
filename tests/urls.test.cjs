const { readdir, stat, readFile } = require('fs/promises')
const test = require('brittle')
const path = require('path')
const https = require('https')

test('check that all urls can be reached', async (t) => {
  const docs = await readMarkdownFiles()

  let urls = await Promise.all(docs.map(async (doc) => {
    const content = (await readFile(doc)).toString()
    const urlRegex = /(?<url>https?:\/\/[^\s)"'`]+)/gi
    return content.match(urlRegex)
  }))

  urls = urls.flat().filter(u => u !== null).filter(u => !u.startsWith('http://localhost'))

  const cache = new Map()
  const responses = await Promise.all(urls.map(async url => {
    if (cache.get(url)) return cache.get(url)
    const result = await checkUrl(url.trim())
    cache.set(url, result)
    return { result, url }
  }))

  for (const response of responses) {
    t.ok(response.result, `${response.url} should return 200 code`)
  }
})

async function readMarkdownFiles (folderPath = path.join(__dirname, '..')) {
  let result = []
  const files = await readdir(folderPath)

  for (const file of files) {
    const filePath = path.join(folderPath, file)
    const stats = await stat(filePath)

    if (!filePath.includes('node_modules') && stats.isDirectory()) {
      result = result.concat(await readMarkdownFiles(filePath))
    } else if (path.extname(filePath) === '.md') {
      result.push(filePath)
    }
  }

  return result
}

function checkUrl (url) {
  return new Promise((resolve, reject) => {
    try {
      https.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true)
        } else {
          resolve(false)
        }
      }).on('error', () => {
        resolve(false)
      })
    } catch (err) {
      console.log(err)
      resolve(false)
    }
  })
}
