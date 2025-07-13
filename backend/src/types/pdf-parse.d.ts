declare module 'pdf-parse' {
  interface PDFData {
    text: string
    numpages: number
    info?: {
      Author?: string
      Subject?: string
      Keywords?: string
      [key: string]: any
    }
  }

  function pdf(buffer: Buffer): Promise<PDFData>
  export = pdf
} 