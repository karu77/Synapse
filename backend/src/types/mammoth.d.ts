declare module 'mammoth' {
  interface ExtractResult {
    value: string
    messages: any[]
  }

  interface ExtractOptions {
    buffer: Buffer
  }

  function extractRawText(options: ExtractOptions): Promise<ExtractResult>
  
  export = {
    extractRawText
  }
} 