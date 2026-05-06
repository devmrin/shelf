const MAX_DIMENSION = 1600
const COVER_THUMB = 320

async function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.readAsDataURL(file)
  })
}

async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Invalid image'))
    }
    image.src = url
  })
}

function drawToCanvas(image: HTMLImageElement, maxSide: number) {
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height))
  const width = Math.round(image.width * ratio)
  const height = Math.round(image.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas unavailable')
  context.drawImage(image, 0, 0, width, height)
  return canvas
}

async function canvasToDataUrl(canvas: HTMLCanvasElement, quality = 0.82) {
  return canvas.toDataURL('image/webp', quality)
}

export async function optimizeImage(file: Blob) {
  const image = await loadImage(file)
  const largeCanvas = drawToCanvas(image, MAX_DIMENSION)
  const thumbCanvas = drawToCanvas(image, COVER_THUMB)

  return {
    full: await canvasToDataUrl(largeCanvas, 0.84),
    thumb: await canvasToDataUrl(thumbCanvas, 0.8),
    fallback: await readAsDataUrl(file),
  }
}

export async function filesFromClipboard(event: ClipboardEvent) {
  const files: File[] = []
  for (const item of event.clipboardData?.items ?? []) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) files.push(file)
    }
  }
  return files
}
