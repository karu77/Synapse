import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import { Express } from 'express'

export interface ExtractedDocument {
  text: string
  title?: string
  metadata?: {
    pageCount?: number
    wordCount?: number
    author?: string
    subject?: string
    keywords?: string[]
  }
}

export class DocumentExtractor {
  /**
   * Extract text content from various document formats
   */
  static async extractText(file: Express.Multer.File): Promise<ExtractedDocument> {
    const { buffer, mimetype, originalname } = file
    
    try {
      switch (mimetype) {
        case 'application/pdf':
          return await this.extractFromPDF(buffer, originalname)
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractFromWord(buffer, originalname)
        
        case 'text/plain':
        case 'text/markdown':
        case 'text/csv':
          return await this.extractFromText(buffer, originalname)
        
        default:
          throw new Error(`Unsupported file type: ${mimetype}`)
      }
    } catch (error) {
      console.error('Document extraction failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to extract text from document: ${errorMessage}`)
    }
  }

  /**
   * Extract text from PDF files
   */
  private static async extractFromPDF(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
    try {
      const data = await pdf(buffer)
      
      return {
        text: data.text,
        title: filename.replace(/\.pdf$/i, ''),
        metadata: {
          pageCount: data.numpages,
          wordCount: data.text.split(/\s+/).length,
          author: data.info?.Author,
          subject: data.info?.Subject,
          keywords: data.info?.Keywords ? data.info.Keywords.split(',').map((k: string) => k.trim()) : undefined
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`PDF extraction failed: ${errorMessage}`)
    }
  }

  /**
   * Extract text from Word documents (.docx, .doc)
   */
  private static async extractFromWord(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
    try {
      const result = await mammoth.extractRawText({ buffer })
      
      return {
        text: result.value,
        title: filename.replace(/\.(docx?|rtf)$/i, ''),
        metadata: {
          wordCount: result.value.split(/\s+/).length
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Word document extraction failed: ${errorMessage}`)
    }
  }

  /**
   * Extract text from plain text files
   */
  private static async extractFromText(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
    try {
      const text = buffer.toString('utf-8')
      
      return {
        text,
        title: filename.replace(/\.(txt|md|csv)$/i, ''),
        metadata: {
          wordCount: text.split(/\s+/).length
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Text file extraction failed: ${errorMessage}`)
    }
  }

  /**
   * Clean and preprocess extracted text for better graph generation
   */
  static preprocessText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere with parsing
      .replace(/[^\w\s.,!?;:()[\]{}"'`~@#$%^&*+=|\\<>/]/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Trim whitespace
      .trim()
  }

  /**
   * Split large documents into manageable chunks for processing
   */
  static splitIntoChunks(text: string, maxChunkSize: number = 4000): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
      const sentenceWithPunctuation = sentence.trim() + '.'
      
      if (currentChunk.length + sentenceWithPunctuation.length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
          currentChunk = sentenceWithPunctuation
        } else {
          // If a single sentence is too long, split it by words
          const words = sentenceWithPunctuation.split(' ')
          let wordChunk = ''
          
          for (const word of words) {
            if (wordChunk.length + word.length + 1 > maxChunkSize) {
              if (wordChunk) {
                chunks.push(wordChunk.trim())
                wordChunk = word
              } else {
                chunks.push(word)
              }
            } else {
              wordChunk += (wordChunk ? ' ' : '') + word
            }
          }
          
          if (wordChunk) {
            currentChunk = wordChunk
          }
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  /**
   * Generate a summary of the document for context
   */
  static generateDocumentSummary(extractedDoc: ExtractedDocument): string {
    const { text, title, metadata } = extractedDoc
    
    let summary = `Document: ${title || 'Untitled'}\n`
    
    if (metadata) {
      if (metadata.pageCount) summary += `Pages: ${metadata.pageCount}\n`
      if (metadata.wordCount) summary += `Word Count: ${metadata.wordCount}\n`
      if (metadata.author) summary += `Author: ${metadata.author}\n`
      if (metadata.subject) summary += `Subject: ${metadata.subject}\n`
    }
    
    // Add a brief preview of the content
    const preview = text.substring(0, 200).replace(/\n/g, ' ')
    summary += `\nContent Preview: ${preview}${text.length > 200 ? '...' : ''}`
    
    return summary
  }
} 