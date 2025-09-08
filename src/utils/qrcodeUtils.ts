import QRCode from 'qrcode'
import QrReader from 'qrcode-reader'

// 二维码生成选项接口
export interface QRCodeOptions {
  text: string
  width?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  type?: 'image/png' | 'image/jpeg' | 'image/webp'
  quality?: number
  margin?: number
}

// 生成二维码
export const generateQRCode = async (options: QRCodeOptions): Promise<string> => {
  try {
    const {
      text,
      width = 256,
      color = { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel = 'M',
      type = 'image/png',
      quality = 0.92,
      margin = 4,
    } = options

    if (!text.trim()) {
      throw new Error('请输入要生成二维码的内容')
    }

    const qrOptions = {
      width,
      color,
      errorCorrectionLevel,
      type,
      quality,
      margin,
    }

    const dataURL = await QRCode.toDataURL(text, qrOptions)
    return dataURL
  } catch (error) {
    throw new Error('二维码生成失败：' + (error as Error).message)
  }
}

// 解析二维码
export const parseQRCode = (imageData: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const qr = new QrReader()

      qr.callback = (error: any, result?: any) => {
        if (error) {
          reject(new Error('二维码解析失败：' + error.message))
          return
        }

        if (result?.result) {
          resolve(result.result)
        } else {
          reject(new Error('无法识别二维码内容'))
        }
      }

      // 创建图片元素
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          // 创建canvas
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('无法创建Canvas上下文'))
            return
          }

          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          // 获取图像数据
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          qr.decode(imageData)
        } catch (error) {
          reject(new Error('图像处理失败：' + (error as Error).message))
        }
      }

      img.onerror = () => {
        reject(new Error('图像加载失败，请检查图片格式'))
      }

      // 处理不同类型的图像数据
      if (imageData.startsWith('data:')) {
        img.src = imageData
      } else {
        // 假设是base64数据
        img.src = `data:image/png;base64,${imageData}`
      }
    } catch (error) {
      reject(new Error('二维码解析失败：' + (error as Error).message))
    }
  })
}

// 从文件读取并解析二维码
export const parseQRCodeFromFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('请选择图片文件'))
      return
    }

    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const imageData = e.target?.result as string
        const result = await parseQRCode(imageData)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsDataURL(file)
  })
}

// 验证颜色格式
export const isValidColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
}

// 获取错误校正级别描述
export const getErrorCorrectionDescription = (level: string): string => {
  const descriptions = {
    L: 'L级 (~7%) - 最低校正能力，最大数据容量',
    M: 'M级 (~15%) - 中等校正能力，推荐使用',
    Q: 'Q级 (~25%) - 较高校正能力，适用于嘈杂环境',
    H: 'H级 (~30%) - 最高校正能力，最小数据容量',
  }
  return descriptions[level as keyof typeof descriptions] || descriptions.M
}
