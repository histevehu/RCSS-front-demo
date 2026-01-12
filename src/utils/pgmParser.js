/**
 * PGM 图片解析器
 * 支持 P5 (二进制) 和 P2 (ASCII) 格式
 */

/**
 * 解析 PGM ArrayBuffer
 * @param {ArrayBuffer} arrayBuffer 
 * @returns {{ width: number, height: number, maxval: number, pixels: Uint8Array }}
 */
export function parsePGM(arrayBuffer) {
  const data = new Uint8Array(arrayBuffer)
  let offset = 0

  // 读取文本行的辅助函数
  function readLine() {
    let line = ''
    while (offset < data.length) {
      const char = String.fromCharCode(data[offset++])
      if (char === '\n') break
      if (char !== '\r') line += char
    }
    return line.trim()
  }

  // 跳过注释
  function skipComments() {
    while (offset < data.length) {
      // 跳过空白
      while (offset < data.length && (data[offset] === 32 || data[offset] === 10 || data[offset] === 13 || data[offset] === 9)) {
        offset++
      }
      // 检查是否是注释
      if (data[offset] === 35) { // '#'
        readLine()
      } else {
        break
      }
    }
  }

  // 读取下一个数字
  function readNumber() {
    skipComments()
    let numStr = ''
    while (offset < data.length) {
      const char = data[offset]
      if (char >= 48 && char <= 57) { // 0-9
        numStr += String.fromCharCode(char)
        offset++
      } else if (numStr.length > 0) {
        break
      } else {
        offset++
      }
    }
    return parseInt(numStr, 10)
  }

  // 读取魔数
  const magic = readLine()
  if (magic !== 'P5' && magic !== 'P2') {
    throw new Error(`不支持的 PGM 格式: ${magic}，仅支持 P5 和 P2`)
  }

  // 读取宽度、高度、最大值
  const width = readNumber()
  const height = readNumber()
  const maxval = readNumber()

  // 跳过一个空白字符（P5 格式在 maxval 后只有一个空白）
  if (magic === 'P5') {
    offset++ // 跳过 maxval 后的换行或空格
  }

  // 读取像素数据
  const pixelCount = width * height
  let pixels

  if (magic === 'P5') {
    // 二进制格式
    if (maxval <= 255) {
      pixels = new Uint8Array(arrayBuffer, offset, pixelCount)
    } else {
      // 16位像素
      const pixels16 = new Uint16Array(pixelCount)
      for (let i = 0; i < pixelCount; i++) {
        pixels16[i] = (data[offset + i * 2] << 8) | data[offset + i * 2 + 1]
      }
      // 转换为8位
      pixels = new Uint8Array(pixelCount)
      for (let i = 0; i < pixelCount; i++) {
        pixels[i] = Math.round((pixels16[i] / maxval) * 255)
      }
    }
  } else {
    // ASCII 格式 P2
    pixels = new Uint8Array(pixelCount)
    for (let i = 0; i < pixelCount; i++) {
      const val = readNumber()
      pixels[i] = maxval <= 255 ? val : Math.round((val / maxval) * 255)
    }
  }

  return { width, height, maxval, pixels: new Uint8Array(pixels) }
}

/**
 * 将像素数据转换为 Canvas
 * @param {Uint8Array} pixels 
 * @param {number} width 
 * @param {number} height 
 * @returns {HTMLCanvasElement}
 */
export function pixelsToCanvas(pixels, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const imageData = ctx.createImageData(width, height)

  for (let i = 0; i < pixels.length; i++) {
    const gray = pixels[i]
    const idx = i * 4
    imageData.data[idx] = gray     // R
    imageData.data[idx + 1] = gray // G
    imageData.data[idx + 2] = gray // B
    imageData.data[idx + 3] = 255  // A
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}
