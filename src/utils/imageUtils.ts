/**
 * 图片压缩和格式转换工具函数
 */

import type {
  WatermarkPosition,
  TextWatermarkConfig,
  ImageWatermarkConfig,
  CropConfig,
  CropRatio,
  RemovalArea,
} from '@/types'

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
 * 预设裁切比例
 */
export const CROP_RATIOS: CropRatio[] = [
  { label: '自由裁切', value: null },
  { label: '1:1 (正方形)', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
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

/**
 * 计算水印位置
 */
export function calculateWatermarkPosition(
  imageWidth: number,
  imageHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  position: WatermarkPosition
): { x: number; y: number } {
  const padding = 20 // 边距

  switch (position) {
    case 'top-left':
      return { x: padding, y: padding }
    case 'top-center':
      return { x: (imageWidth - watermarkWidth) / 2, y: padding }
    case 'top-right':
      return { x: imageWidth - watermarkWidth - padding, y: padding }
    case 'middle-left':
      return { x: padding, y: (imageHeight - watermarkHeight) / 2 }
    case 'middle-center':
      return {
        x: (imageWidth - watermarkWidth) / 2,
        y: (imageHeight - watermarkHeight) / 2,
      }
    case 'middle-right':
      return {
        x: imageWidth - watermarkWidth - padding,
        y: (imageHeight - watermarkHeight) / 2,
      }
    case 'bottom-left':
      return { x: padding, y: imageHeight - watermarkHeight - padding }
    case 'bottom-center':
      return {
        x: (imageWidth - watermarkWidth) / 2,
        y: imageHeight - watermarkHeight - padding,
      }
    case 'bottom-right':
      return {
        x: imageWidth - watermarkWidth - padding,
        y: imageHeight - watermarkHeight - padding,
      }
    default:
      return { x: padding, y: padding }
  }
}

/**
 * 添加文字水印
 */
export async function addTextWatermark(
  image: HTMLImageElement,
  config: TextWatermarkConfig
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 上下文创建失败')
  }

  // 绘制原图
  ctx.drawImage(image, 0, 0)

  // 设置文字样式
  ctx.font = `${config.fontSize}px ${config.fontFamily}`
  ctx.fillStyle = config.color
  ctx.globalAlpha = config.opacity

  // 测量文字尺寸
  const metrics = ctx.measureText(config.text)
  const textWidth = metrics.width
  const textHeight = config.fontSize

  if (config.tiled) {
    // 平铺模式
    const spacing = config.spacing || 100
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((config.rotation * Math.PI) / 180)

    for (let y = -canvas.height; y < canvas.height; y += textHeight + spacing) {
      for (let x = -canvas.width; x < canvas.width; x += textWidth + spacing) {
        ctx.fillText(config.text, x, y)
      }
    }
    ctx.restore()
  } else {
    // 单个水印
    const pos = calculateWatermarkPosition(
      canvas.width,
      canvas.height,
      textWidth,
      textHeight,
      config.position
    )

    ctx.save()
    ctx.translate(pos.x + textWidth / 2, pos.y + textHeight / 2)
    ctx.rotate((config.rotation * Math.PI) / 180)
    ctx.fillText(config.text, -textWidth / 2, textHeight / 4)
    ctx.restore()
  }

  // 导出为 Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('图片导出失败'))
        }
      },
      'image/png',
      1
    )
  })
}

/**
 * 添加图片水印
 */
export async function addImageWatermark(
  image: HTMLImageElement,
  config: ImageWatermarkConfig
): Promise<Blob> {
  const watermarkImg = await loadImage(config.imageFile)

  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 上下文创建失败')
  }

  // 绘制原图
  ctx.drawImage(image, 0, 0)

  // 计算水印尺寸
  const watermarkWidth = watermarkImg.width * config.scale
  const watermarkHeight = watermarkImg.height * config.scale

  ctx.globalAlpha = config.opacity

  if (config.tiled) {
    // 平铺模式
    const spacing = config.spacing || 50
    for (let y = 0; y < canvas.height; y += watermarkHeight + spacing) {
      for (let x = 0; x < canvas.width; x += watermarkWidth + spacing) {
        ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight)
      }
    }
  } else {
    // 单个水印
    const pos = calculateWatermarkPosition(
      canvas.width,
      canvas.height,
      watermarkWidth,
      watermarkHeight,
      config.position
    )

    ctx.drawImage(watermarkImg, pos.x, pos.y, watermarkWidth, watermarkHeight)
  }

  // 导出为 Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('图片导出失败'))
        }
      },
      'image/png',
      1
    )
  })
}

/**
 * 裁切图片
 */
export async function cropImage(
  image: HTMLImageElement,
  config: CropConfig
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = config.width
  canvas.height = config.height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 上下文创建失败')
  }

  // 裁切并绘制
  ctx.drawImage(
    image,
    config.x,
    config.y,
    config.width,
    config.height,
    0,
    0,
    config.width,
    config.height
  )

  // 导出为 Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('图片导出失败'))
        }
      },
      'image/png',
      1
    )
  })
}

/**
 * 按比例计算裁切区域（居中裁切）
 */
export function calculateCropWithRatio(
  imageWidth: number,
  imageHeight: number,
  ratio: number | null
): CropConfig {
  if (ratio === null) {
    // 自由裁切，返回整个图片
    return { x: 0, y: 0, width: imageWidth, height: imageHeight }
  }

  const imageRatio = imageWidth / imageHeight

  let cropWidth: number
  let cropHeight: number

  if (imageRatio > ratio) {
    // 图片更宽，以高度为基准
    cropHeight = imageHeight
    cropWidth = cropHeight * ratio
  } else {
    // 图片更高，以宽度为基准
    cropWidth = imageWidth
    cropHeight = cropWidth / ratio
  }

  // 居中裁切
  const x = (imageWidth - cropWidth) / 2
  const y = (imageHeight - cropHeight) / 2

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.min(cropWidth, imageWidth),
    height: Math.min(cropHeight, imageHeight),
  }
}

/**
 * 擦除区域（填充周围颜色的平均值）
 */
export function eraseArea(imageData: ImageData, area: RemovalArea): ImageData {
  const { x, y, width, height } = area
  const data = imageData.data
  const imgWidth = imageData.width

  // 采样周围像素计算平均颜色
  const sampleSize = 5
  let r = 0,
    g = 0,
    b = 0,
    count = 0

  // 采样上边缘
  for (let i = Math.max(0, x); i < Math.min(imgWidth, x + width); i += sampleSize) {
    const idx = (Math.max(0, y - 1) * imgWidth + i) * 4
    r += data[idx]
    g += data[idx + 1]
    b += data[idx + 2]
    count++
  }

  // 采样下边缘
  for (let i = Math.max(0, x); i < Math.min(imgWidth, x + width); i += sampleSize) {
    const idx = (Math.min(imageData.height - 1, y + height) * imgWidth + i) * 4
    r += data[idx]
    g += data[idx + 1]
    b += data[idx + 2]
    count++
  }

  // 计算平均颜色
  r = Math.round(r / count)
  g = Math.round(g / count)
  b = Math.round(b / count)

  // 填充区域
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      if (row >= 0 && row < imageData.height && col >= 0 && col < imgWidth) {
        const idx = (row * imgWidth + col) * 4
        data[idx] = r
        data[idx + 1] = g
        data[idx + 2] = b
        // alpha 保持不变
      }
    }
  }

  return imageData
}

/**
 * 模糊区域（高斯模糊）
 */
export function blurArea(imageData: ImageData, area: RemovalArea): ImageData {
  const { x, y, width, height, intensity = 5 } = area
  const data = imageData.data
  const imgWidth = imageData.width
  const radius = Math.max(1, Math.floor(intensity))

  // 创建临时数据副本
  const tempData = new Uint8ClampedArray(data)

  // 对区域内每个像素应用模糊
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      if (row >= 0 && row < imageData.height && col >= 0 && col < imgWidth) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0

        // 采样周围像素
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const sampleRow = row + dy
            const sampleCol = col + dx

            if (
              sampleRow >= 0 &&
              sampleRow < imageData.height &&
              sampleCol >= 0 &&
              sampleCol < imgWidth
            ) {
              const idx = (sampleRow * imgWidth + sampleCol) * 4
              r += tempData[idx]
              g += tempData[idx + 1]
              b += tempData[idx + 2]
              count++
            }
          }
        }

        // 设置平均值
        const idx = (row * imgWidth + col) * 4
        data[idx] = Math.round(r / count)
        data[idx + 1] = Math.round(g / count)
        data[idx + 2] = Math.round(b / count)
      }
    }
  }

  return imageData
}

/**
 * 马赛克区域（像素块化）
 */
export function mosaicArea(imageData: ImageData, area: RemovalArea): ImageData {
  const { x, y, width, height, intensity = 10 } = area
  const data = imageData.data
  const imgWidth = imageData.width
  const blockSize = Math.max(2, Math.floor(intensity))

  // 对区域按块处理
  for (let row = y; row < y + height; row += blockSize) {
    for (let col = x; col < x + width; col += blockSize) {
      // 计算块的平均颜色
      let r = 0,
        g = 0,
        b = 0,
        count = 0

      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const sampleRow = row + dy
          const sampleCol = col + dx

          if (
            sampleRow >= 0 &&
            sampleRow < imageData.height &&
            sampleCol >= 0 &&
            sampleCol < imgWidth
          ) {
            const idx = (sampleRow * imgWidth + sampleCol) * 4
            r += data[idx]
            g += data[idx + 1]
            b += data[idx + 2]
            count++
          }
        }
      }

      // 计算平均值
      r = Math.round(r / count)
      g = Math.round(g / count)
      b = Math.round(b / count)

      // 填充整个块
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const fillRow = row + dy
          const fillCol = col + dx

          if (
            fillRow >= 0 &&
            fillRow < imageData.height &&
            fillCol >= 0 &&
            fillCol < imgWidth
          ) {
            const idx = (fillRow * imgWidth + fillCol) * 4
            data[idx] = r
            data[idx + 1] = g
            data[idx + 2] = b
          }
        }
      }
    }
  }

  return imageData
}
