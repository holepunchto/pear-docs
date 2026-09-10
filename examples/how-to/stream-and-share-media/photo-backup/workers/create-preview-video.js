const ffmpeg = require('bare-ffmpeg')

async function createPreviewVideo (filePath) {
  console.log('Creating preview video', filePath, !!ffmpeg)
  // TODO: generate video preview thumbnail using ffmpeg
  return undefined
}

module.exports = createPreviewVideo
