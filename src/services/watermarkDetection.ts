import type { WatermarkRegion, DetectionConfig } from '@/types'

/**
 * 水印检测服务接口
 */
export interface IWatermarkDetector {
  detect(imageData: ImageData, config: DetectionConfig): Promise<WatermarkRegion[]>
}

/**
 * 默认检测配置
 */
export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  sensitivity: 0.5,
  minRegionSize: 20,
  maxRegionSize: 500,
  confidenceThreshold: 0.6
}

/**
 * 计算图像块的颜色方差
 */
function calculateColorVariance(
  data: Uint8ClampedArray,
  startX: number,
  startY: number,
  blockSize: number,
  imageWidth: number
): number {
  let rSum = 0,
    gSum = 0,
    bSum = 0
  let count = 0

  for (let y = startY; y < startY + blockSize; y++) {
    for (let x = startX; x < startX + blockSize; x++) {
      const idx = (y * imageWidth + x) * 4
      rSum += data[idx]
      gSum += data[idx + 1]
      bSum += data[idx + 2]
      count++
    }
  }

  const rAvg = rSum / count
  const gAvg = gSum / count
  const bAvg = bSum / count

  let variance = 0
  for (let y = startY; y < startY + blockSize; y++) {
    for (let x = startX; x < startX + blockSize; x++) {
      const idx = (y * imageWidth + x) * 4
      variance += Math.pow(data[idx] - rAvg, 2)
      variance += Math.pow(data[idx + 1] - gAvg, 2)
      variance += Math.pow(data[idx + 2] - bAvg, 2)
    }
  }

  return variance / (count * 3)
}

/**
 * Sobel边缘检测
 */
function detectEdges(imageData: ImageData): ImageData {
  const width = imageData.width
  const height = imageData.height
  const data = imageData.data
  const edgeData = new Uint8ClampedArray(data.length)

  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ]
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0,
        gy = 0

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
          gx += gray * sobelX[ky + 1][kx + 1]
          gy += gray * sobelY[ky + 1][kx + 1]
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy)
      const idx = (y * width + x) * 4
      edgeData[idx] = edgeData[idx + 1] = edgeData[idx + 2] = magnitude
      edgeData[idx + 3] = 255
    }
  }

  return new ImageData(edgeData, width, height)
}

/**
 * 前端检测器实现
 */
export class FrontendDetector implements IWatermarkDetector {
  async detect(imageData: ImageData, config: DetectionConfig): Promise<WatermarkRegion[]> {
    const regions: WatermarkRegion[] = []
    const blockSize = 32
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data

    // 检测边缘
    const edgeData = detectEdges(imageData)

    // 遍历图像块
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        // 计算颜色方差
        const variance = calculateColorVariance(data, x, y, blockSize, width)

        // 计算边缘密度
        let edgeCount = 0
        for (let by = y; by < y + blockSize; by++) {
          for (let bx = x; bx < x + blockSize; bx++) {
            const idx = (by * width + bx) * 4
            if (edgeData.data[idx] > 50) edgeCount++
          }
        }
        const edgeDensity = edgeCount / (blockSize * blockSize)

        // 计算位置权重(四角和中心)
        const centerX = width / 2
        const centerY = height / 2
        const distToCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
        const positionWeight = 1 - (distToCenter / maxDist) * 0.5

        // 计算置信度
        const varianceScore = variance < 1000 ? 0.5 : 0
        const edgeScore = edgeDensity > 0.3 ? 0.3 : 0
        let confidence = (varianceScore + edgeScore) * positionWeight * config.sensitivity

        // 过滤低置信度区域
        if (confidence >= config.confidenceThreshold) {
          regions.push({
            id: `region-${x}-${y}`,
            x,
            y,
            width: blockSize,
            height: blockSize,
            confidence: Math.min(confidence, 1)
          })
        }
      }
    }

    // 合并相邻区域
    return mergeAdjacentRegions(regions, config)
  }
}

/**
 * 合并相邻区域
 */
function mergeAdjacentRegions(
  regions: WatermarkRegion[],
  config: DetectionConfig
): WatermarkRegion[] {
  if (regions.length === 0) return []

  const merged: WatermarkRegion[] = []
  const used = new Set<string>()

  for (const region of regions) {
    if (used.has(region.id)) continue

    let mergedRegion = { ...region }
    used.add(region.id)

    // 查找相邻区域
    for (const other of regions) {
      if (used.has(other.id)) continue

      const isAdjacent =
        Math.abs(region.x - other.x) <= region.width &&
        Math.abs(region.y - other.y) <= region.height

      if (isAdjacent) {
        // 合并区域
        const minX = Math.min(mergedRegion.x, other.x)
        const minY = Math.min(mergedRegion.y, other.y)
        const maxX = Math.max(mergedRegion.x + mergedRegion.width, other.x + other.width)
        const maxY = Math.max(mergedRegion.y + mergedRegion.height, other.y + other.height)

        mergedRegion = {
          id: `merged-${minX}-${minY}`,
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          confidence: Math.max(mergedRegion.confidence, other.confidence)
        }
        used.add(other.id)
      }
    }

    // 过滤尺寸不符合的区域
    const size = mergedRegion.width * mergedRegion.height
    if (size >= config.minRegionSize && size <= config.maxRegionSize * config.maxRegionSize) {
      merged.push(mergedRegion)
    }
  }

  // 按置信度降序排列
  return merged.sort((a, b) => b.confidence - a.confidence)
}
