declare module 'qrcode-reader' {
  interface QrReaderResult {
    result?: string
  }

  interface QrReaderError {
    message: string
  }

  class QrReader {
    constructor()
    callback: (error: QrReaderError | null, result?: QrReaderResult) => void
    decode(imageData: ImageData): void
  }

  export = QrReader
}
