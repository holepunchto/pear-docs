const { image } = require('bare-media')

const MIMETYPE = 'image/webp'

async function createPreviewImage (filePath) {
  const buffer = await image(filePath)
    .decode()
    .resize({ maxWidth: 256, maxHeight: 256 })
    .encode({ mimetype: MIMETYPE })
  return `data:${MIMETYPE};base64,${buffer.toString('base64')}`
}

module.exports = createPreviewImage
