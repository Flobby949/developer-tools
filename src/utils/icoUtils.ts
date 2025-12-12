/**
 * ICO 图标生成工具函数
 * 支持将图片转换为多尺寸 ICO 格式
 */

/**
 * ICO 图标尺寸配置
 */
export interface IcoSize {
  width: number
  height: number
  label: string
  enabled: boolean
}

/**
 * 单个尺寸的预览数据
 */
export interface IcoPreviewItem {
  size: IcoSize
  dataUrl: string
  blob: Blob
}

/**
 * 默认支持的 ICO 尺寸列表
 */
export const DEFAULT_ICO_SIZES: IcoSize[] = [
  { width: 16, height: 16, label: '16x16', enabled: true },
  { width: 32, height: 32, label: '32x32', enabled: true },
  { width: 48, height: 48, label: '48x48', enabled: true },
  { width: 64, height: 64, label: '64x64', enabled: false },
  { width: 128, height: 128, label: '128x128', enabled: false },
  { width: 256, height: 256, label: '256x256', enabled: false },
]

/**
 * 加载图片文件为 HTMLImageElement
 */
export function loadImageElement(source: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(source)

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
 * 将图片缩放到指定尺寸
 * @param img - 源图片元素
 * @param size - 目标尺寸
 * @returns PNG 格式的 Blob
 */
export function resizeImageToSize(img: HTMLImageElement, size: IcoSize): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas 上下文创建失败'))
      return
    }

    // 设置高质量缩放
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // 清空画布（透明背景）
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 计算绘制区域（保持宽高比，居中绘制）
    const scale = Math.min(size.width / img.width, size.height / img.height)
    const drawWidth = img.width * scale
    const drawHeight = img.height * scale
    const drawX = (size.width - drawWidth) / 2
    const drawY = (size.height - drawHeight) / 2

    // 绘制缩放后的图片
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

    // 导出为 PNG Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas 导出失败'))
        }
      },
      'image/png',
      1,
    )
  })
}

/**
 * 生成多尺寸预览数据
 * @param source - 图片源文件
 * @param sizes - 启用的尺寸列表
 * @returns 预览数据数组
 */
export async function generatePreviews(
  source: File | Blob,
  sizes: IcoSize[],
): Promise<IcoPreviewItem[]> {
  const img = await loadImageElement(source)
  const previews: IcoPreviewItem[] = []

  for (const size of sizes) {
    if (!size.enabled) continue

    const blob = await resizeImageToSize(img, size)
    const dataUrl = URL.createObjectURL(blob)

    previews.push({
      size,
      dataUrl,
      blob,
    })
  }

  return previews
}

/**
 * 构建 ICO 文件
 *
 * ICO 文件格式：
 * - ICONDIR (6 bytes): 文件头
 * - ICONDIRENTRY[] (16 bytes each): 图像目录
 * - Image Data: PNG 图像数据
 */
export async function buildIcoFile(pngBlobs: Blob[], sizes: IcoSize[]): Promise<Blob> {
  const imageCount = pngBlobs.length

  // 读取所有 PNG 数据
  const pngDataArrays: ArrayBuffer[] = []
  for (const blob of pngBlobs) {
    pngDataArrays.push(await blob.arrayBuffer())
  }

  // 计算偏移量
  const headerSize = 6
  const dirEntrySize = 16
  const dirTotalSize = dirEntrySize * imageCount
  let dataOffset = headerSize + dirTotalSize

  // 创建 ICO 文件头 (ICONDIR)
  const header = new ArrayBuffer(6)
  const headerView = new DataView(header)
  headerView.setUint16(0, 0, true) // 保留字段，必须为 0
  headerView.setUint16(2, 1, true) // 图像类型：1 = ICO
  headerView.setUint16(4, imageCount, true) // 图像数量

  // 创建目录条目 (ICONDIRENTRY)
  const dirEntries: ArrayBuffer[] = []
  for (let i = 0; i < imageCount; i++) {
    const entry = new ArrayBuffer(16)
    const entryView = new DataView(entry)
    const { width, height } = sizes[i]
    const dataSize = pngDataArrays[i].byteLength

    // 宽度和高度：256 用 0 表示
    entryView.setUint8(0, width >= 256 ? 0 : width)
    entryView.setUint8(1, height >= 256 ? 0 : height)
    entryView.setUint8(2, 0) // 调色板颜色数（0 = 无调色板）
    entryView.setUint8(3, 0) // 保留字段
    entryView.setUint16(4, 1, true) // 色彩平面数
    entryView.setUint16(6, 32, true) // 每像素位数（32 位真彩色）
    entryView.setUint32(8, dataSize, true) // 图像数据大小
    entryView.setUint32(12, dataOffset, true) // 图像数据偏移量

    dirEntries.push(entry)
    dataOffset += dataSize
  }

  // 合并所有数据
  const parts = [header, ...dirEntries, ...pngDataArrays]
  return new Blob(parts, { type: 'image/x-icon' })
}

/**
 * 一站式 ICO 生成函数
 * @param source - 原始图片文件
 * @param sizes - 要生成的尺寸列表（只处理 enabled=true 的）
 * @returns ICO 文件 Blob
 */
export async function generateIcoFile(source: File | Blob, sizes: IcoSize[]): Promise<Blob> {
  const enabledSizes = sizes.filter((s) => s.enabled)

  if (enabledSizes.length === 0) {
    throw new Error('请至少选择一个尺寸')
  }

  // 按尺寸从小到大排序（ICO 文件惯例）
  const sortedSizes = [...enabledSizes].sort((a, b) => a.width - b.width)

  const img = await loadImageElement(source)
  const pngBlobs: Blob[] = []

  for (const size of sortedSizes) {
    const blob = await resizeImageToSize(img, size)
    pngBlobs.push(blob)
  }

  return buildIcoFile(pngBlobs, sortedSizes)
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
 * 获取尺寸描述
 */
export function getSizeDescription(width: number): string {
  const descriptions: Record<number, string> = {
    16: '标签页图标',
    32: '标准图标',
    48: '大图标',
    64: '高清图标',
    128: '大尺寸',
    256: '超大图标',
  }
  return descriptions[width] || ''
}
