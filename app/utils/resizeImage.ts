const MAX_SIZE = 256

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

/**
 * Scales an image down to fit within 256x256 (aspect ratio preserved, never upscaled)
 * and returns a base64 data URL. WebP gives the best compression; browsers without
 * WebP encoding fall back to PNG automatically, so JPEG is used as a safer fallback.
 */
export async function resizeImage(file: Blob, maxSize = MAX_SIZE, quality = 0.8): Promise<string> {
  const img = await loadImage(file)
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  const webp = canvas.toDataURL('image/webp', quality)
  if (webp.startsWith('data:image/webp')) return webp

  // JPEG has no alpha channel, so flatten onto white first
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}
