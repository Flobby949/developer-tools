/**
 * 图片压缩和格式转换工具函数
 */

/**
 * 支持的图片格式
 */
export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp'

export interface ImageFormatOption {
  value: ImageFormat
  label: string
  extension: string
  supportsTransparency: boolean
  supportsQuality: boolean
}

export const IMAGE_FORMATS: ImageFormatOption[] = [
  { value: 'image/jpeg', label: 'JPEG', extension: '.jpg', supportsTransparency: false, supportsQuality: true },
  { value: 'image/png', label: 'PNG', extension: '.png', supportsTransparency: true, supportsQuality: false },
  { value: 'image/webp', label: 'WebP', extension: '.webp', supportsTransparency: true, supportsQuality: true },
]

/**
 * 压缩选项
 */
export interface CompressOptions {
  quality: number          // 0-1，仅对 JPEG/WebP 有效
  maxWidth?: number        // 最大宽度
  maxHeight?: number       // 最大高度
  outputFormat: ImageFormat // 输出格式
}

/**
 * 压缩结果
 */
export interface CompressResult {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  originalSize: number
  compressedSize: number
  compressionRatio: number  // 压缩率百分比
}

/**
 * 加载图片文件为 HTMLImageElement
 */
export function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}

/**
 * 计算缩放后的尺寸
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  let width = originalWidth
  let height = originalHeight

  if (maxWidth && width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  if (maxHeight && height > maxHeight) {
    width = Math.round((width * maxHeight) / height)
    height = maxHeight
  }

  return { width, height }
}

/**
 * 压缩和转换图片
 */
export async function compressImage(
  file: File | Blob,
  options: CompressOptions
): Promise<CompressResult> {
  const img = await loadImage(file)
  const originalSize = file.size

  // 计算目标尺寸
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    options.maxWidth,
    options.maxHeight
  )

  // 创建 Canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 上下文创建失败')
  }

  // 设置高质量缩放
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // 如果输出格式不支持透明（JPEG），填充白色背景
  if (options.outputFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
  }

  // 绘制图片
  ctx.drawImage(img, 0, 0, width, height)

  // 导出为 Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('图片导出失败'))
        }
      },
      options.outputFormat,
      options.quality
    )
  })

  // 生成预览 URL
  const dataUrl = URL.createObjectURL(blob)

  // 计算压缩率
  const compressedSize = blob.size
  const compressionRatio = originalSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0

  return {
    blob,
    dataUrl,
    width,
    height,
    originalSize,
    compressedSize,
    compressionRatio,
  }
}

/**
 * 批量压缩图片
 */
export async function compressImages(
  files: File[],
  options: CompressOptions,
  onProgress?: (index: number, total: number) => void
): Promise<CompressResult[]> {
  const results: CompressResult[] = []

  for (let i = 0; i < files.length; i++) {
    if (onProgress) {
      onProgress(i, files.length)
    }
    const result = await compressImage(files[i], options)
    results.push(result)
  }

  if (onProgress) {
    onProgress(files.length, files.length)
  }

  return results
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取文件扩展名
 */
export function getExtension(format: ImageFormat): string {
  const formatOption = IMAGE_FORMATS.find(f => f.value === format)
  return formatOption?.extension || '.jpg'
}

/**
 * 从文件名获取不带扩展名的名称
 */
export function getFileNameWithoutExt(filename: string): string {
  return filename.replace(/\.[^.]+$/, '')
}

/**
 * 下载文件
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 检测图片是否有透明通道
 */
export async function hasTransparency(file: File | Blob): Promise<boolean> {
  const img = await loadImage(file)

  const canvas = document.createElement('canvas')
  canvas.width = Math.min(img.width, 100) // 采样检测，不需要全图
  canvas.height = Math.min(img.height, 100)
  const ctx = canvas.getContext('2d')

  if (!ctx) return false

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // 检查 alpha 通道
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true
    }
  }

  return false
}
