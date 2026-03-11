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
