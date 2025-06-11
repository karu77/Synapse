import { Request, Response } from 'express'
import History from '../models/History'
import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import axios from 'axios'
import path from 'path'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const sanitizeJsonString = (jsonString: string): string => {
  const malformedEntityRegex = /\{\s*"id":\s*"(e\d+)"\s*:\s*(\{[\s\S]+?\})\s*\}/g
  return jsonString.replace(malformedEntityRegex, (match, id, innerJson) => {
    const innerContent = innerJson.substring(1, innerJson.length - 1)
    return `{"id": "${id}", ${innerContent}}`
  })
}

const extractGraphData = (response: string) => {
  let jsonString = ''
  try {
    // Attempt to find JSON within triple backticks, with or without the 'json' language identifier
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1].trim()
    } else {
      // As a fallback, find the first '{' and the last '}'
      const firstBrace = response.indexOf('{')
      const lastBrace = response.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonString = response.substring(firstBrace, lastBrace + 1).trim()
      } else {
        // If no JSON structure is found, log it and return empty
        console.error('Could not find any JSON-like structure in the AI response.')
        return { nodes: [], edges: [] }
      }
    }

    // At this point, jsonString should contain our best guess for the JSON content.
    // It might still be malformed, so the final parsing is in a try-catch.
    const data = JSON.parse(jsonString)

    // Ensure relationships have unique IDs for the frontend
    const relationshipsWithIds = (data.relationships || []).map((edge: any, index: number) => ({
      ...edge,
      id: `edge_${Date.now()}_${index}`,
    }))

    return {
      nodes: data.entities || [],
      edges: relationshipsWithIds,
    }
  } catch (error) {
    console.error('Failed to parse JSON from AI response.', {
      // Use the jsonString we attempted to parse, not a sanitized version
      attemptedJsonString: jsonString,
      originalResponse: response,
      parsingError: error,
    })
    // Sanitize and retry only if there is a parsing error
    try {
      console.log('Attempting to parse sanitized JSON...')
      const sanitizedJsonString = sanitizeJsonString(jsonString)
      const data = JSON.parse(sanitizedJsonString)
      const relationshipsWithIds = (data.relationships || []).map((edge: any, index: number) => ({
        ...edge,
        id: `edge_${Date.now()}_${index}`,
      }))
      return {
        nodes: data.entities || [],
        edges: relationshipsWithIds,
      }
    } catch (finalError) {
      console.error('Failed to parse even after sanitization.', {
        originalJsonString: jsonString,
        finalParsingError: finalError,
      })
      return { nodes: [], edges: [] }
    }
  }
}

function fileToGenerativePart(file: Express.Multer.File): Part {
  return {
    inlineData: {
      data: file.buffer.toString('base64'),
      mimeType: file.mimetype,
    },
  }
}

const extractJson = (text: string): any => {
  if (!text) return null

  try {
    // Try to extract JSON from a code block (```json ... ```) or (``` ...)
    let jsonString = text.trim()
    const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (codeBlockMatch && codeBlockMatch[1]) {
      jsonString = codeBlockMatch[1].trim()
    } else {
      // Fallback: extract from first '{' to last '}'
      const firstBrace = jsonString.indexOf('{')
      const lastBrace = jsonString.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1)
      }
    }

    // Clean up the JSON string
    const cleanJsonString = jsonString
      .replace(/^[^{[]*([{\[])/, '$1')  // Remove any text before the first { or [
      .replace(/[^}\]]*$/, '')          // Remove any text after the last } or ]
      .replace(/[\u2018\u2019]/g, "'")  // Replace smart quotes with straight quotes
      .replace(/[\u201C\u201D]/g, '"')

    return JSON.parse(cleanJsonString)
  } catch (error) {
    console.error('Failed to parse JSON:', error)
    console.error('Problematic text:', text.substring(0, 500) + '...')
    return null
  }
}

const isYouTubeUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
  return youtubeRegex.test(url)
}

const cleanYouTubeUrl = (url: string): string => {
  try {
    const urlObject = new URL(url)
    if (urlObject.hostname === 'youtu.be') {
      const videoId = urlObject.pathname.slice(1)
      return `https://www.youtube.com/watch?v=${videoId}`
    }
    if (urlObject.hostname.includes('youtube.com')) {
      const videoId = urlObject.searchParams.get('v')
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`
      }
    }
    return url
  } catch (error) {
    console.error('Error parsing or cleaning YouTube URL, returning original:', error)
    return url
  }
}

const isValidHttpUrl = (string: string) => {
  let url
  try {
    url = new URL(string)
  } catch (_) {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

async function downloadFileFromUrl(url: string): Promise<{ buffer: Buffer, mimeType: string, fileName: string }> {
  const response = await axios.get(url, { responseType: 'arraybuffer' })
  const contentType = response.headers['content-type'] || 'application/octet-stream'
  const fileName = path.basename(new URL(url).pathname)
  return { buffer: Buffer.from(response.data), mimeType: contentType, fileName }
}

export const generateGraphAndSave = async (req: Request, res: Response) => {
  try {
    const { textInput, question, imageUrl, audioUrl } = req.body
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    let audioPart: Part | null = null
    let imagePart: Part | null = null
    const hasImage = (files.imageFile && files.imageFile.length > 0) || imageUrl
    const hasAudio = (files.audioFile && files.audioFile.length > 0) || audioUrl

    // Handle image file or image URL
    if (files.imageFile && files.imageFile.length > 0) {
      imagePart = fileToGenerativePart(files.imageFile[0])
    } else if (imageUrl) {
      try {
        const { buffer, mimeType } = await downloadFileFromUrl(imageUrl)
        imagePart = {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType,
          },
        }
      } catch (err) {
        console.error('Failed to download image from URL:', err)
        return res.status(400).json({ error: 'Failed to download image from URL.' })
      }
    }

    // Handle audio/video file or audio URL
    if (files.audioFile && files.audioFile.length > 0) {
      audioPart = fileToGenerativePart(files.audioFile[0])
    } else if (audioUrl) {
      try {
        const { buffer, mimeType } = await downloadFileFromUrl(audioUrl)
        audioPart = {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType,
          },
        }
      } catch (err) {
        console.error('Failed to download audio/video from URL:', err)
        return res.status(400).json({ error: 'Failed to download audio/video from URL.' })
      }
    }

    if (!textInput && !question && !hasImage && !audioPart) {
      return res.status(400).json({ error: 'At least one input is required.' })
    }

    let textPrompt: string

    // Only provide an answer if the question field is filled
    if (question) {
      textPrompt = `The user has asked a question. Your task is to first provide a concise and informative textual answer, and then create a detailed knowledge graph that visualizes the key entities and relationships from your answer. The graph should be comprehensive, including pioneers, key concepts, and related ideas.

      User's Question: "${question}"

      **Instructions:**
      1.  **Formulate Answer:** First, create a clear, detailed, and well-structured textual answer to the user's question.
      2.  **Build Graph:** Based on your answer, identify all relevant entities (people, organizations, locations, concepts, etc.) and the relationships connecting them.
      3.  **Be Comprehensive:** The graph should not just represent the direct answer, but also include important related context to provide a richer understanding.
      4.  **Perform Sentiment Analysis:** For every single entity and every single relationship, you MUST determine its sentiment from the context. The sentiment must be one of three string values: "positive", "negative", or "neutral".
      5.  **Strict JSON Output:** Return the output *only* as a single JSON object with two top-level keys: "answer" and "graph". Do not include any other text, comments, or formatting.
      `
    } else {
      // For all other input (text, image, audio/video), only generate a graph, no answer
      textPrompt = `Your primary goal is to build a comprehensive and highly-connected knowledge graph from the provided inputs. Identify *all* plausible entities and the relationships that connect them. It is crucial to be exhaustive.

      The user provided:
      ${textInput ? `Text: "${textInput}"` : ''}
      ${hasImage ? 'An image file or image URL.' : ''}
      ${audioPart ? 'An audio/video file or audio URL.' : ''}

      **Instructions:**
      1.  **Be Exhaustive:** Find every possible entity and relationship. It's better to include a minor relationship than to omit one. Aim for a dense, well-connected graph.
      2.  **Perform Sentiment Analysis:** For every single entity and every single relationship, you MUST determine its sentiment from the context. The sentiment must be one of three string values: "positive", "negative", or "neutral".
      3.  **Strict JSON Output:** Return the output *only* as a single JSON object with a single top-level key: "graph". Do not include any other text, comments, or formatting.
      `
    }

    const fullPrompt = `${textPrompt}

      Here is the required structure with an example. If the user asks a question, use the first structure. Otherwise, use the second.
      
      Structure for Questions:
      {
        "answer": "A detailed textual answer to the user's question goes here...",
        "graph": {
          "entities": [
            {"id": "e1", "label": "Example Entity", "type": "CONCEPT", "sentiment": "neutral"}
          ],
          "relationships": [
            {"source": "e1", "target": "e2", "label": "IS_RELATED_TO", "sentiment": "neutral"}
          ]
        }
      }

      Structure for General Text/File Analysis:
      {
        "graph": {
          "entities": [
            {"id": "e1", "label": "Synapse", "type": "PRODUCT", "sentiment": "positive"},
            {"id": "e2", "label": "Gemini API", "type": "PRODUCT", "sentiment": "neutral"}
          ],
          "relationships": [
            {"source": "e1", "target": "e2", "label": "USES", "sentiment": "neutral"}
          ]
        }
      }
      
      Use only the following specific entity types: PERSON, ORG, LOCATION, DATE, EVENT, PRODUCT, CONCEPT, JOB_TITLE, FIELD_OF_STUDY, THEORY, ART_WORK.
    `

    const promptParts: Part[] = [{ text: fullPrompt }]
    if (imagePart) promptParts.push(imagePart)
    if (audioPart) promptParts.push(audioPart)

    const result = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent({
      contents: [{ role: 'user', parts: promptParts }],
    })

    const aiResponse = extractJson(result.response.text())
    if (!aiResponse) {
      return res.status(500).json({ 
        error: 'The AI response was not valid JSON.',
        details: 'Could not parse the response into valid JSON format.'
      })
    }

    // The AI response could be { graph: { ... } } OR { answer: '...', graph: { ... } }
    // PATCH: If only answer is present, try to generate a graph from the answer text
    let graphData = aiResponse.graph || (aiResponse.graphData ? aiResponse.graphData : null)
    let answer = aiResponse.answer || ''

    if (!graphData && answer) {
      // Try to extract a graph from the answer text (call extractGraphData)
      const extracted = extractGraphData(answer)
      if (extracted.nodes.length > 0 || extracted.edges.length > 0) {
        graphData = { entities: extracted.nodes, relationships: extracted.edges }
      }
    }

    // Accept both {entities, relationships} and {nodes, edges} for robustness
    let nodes = []
    let edges = []
    if (graphData) {
      if (Array.isArray(graphData.nodes) && Array.isArray(graphData.edges)) {
        nodes = graphData.nodes
        edges = graphData.edges
      } else if (Array.isArray(graphData.entities) && Array.isArray(graphData.relationships)) {
        nodes = graphData.entities
        edges = graphData.relationships
      }
    }

    if (!nodes.length || !edges.length) {
      return res.status(500).json({ error: 'The AI response did not contain valid graph data.' })
    }

    // PATCH: Always return { nodes, edges } to the frontend
    const graphDataForFrontend = {
      nodes,
      edges,
    }

    const historyItem = new History({
      user: req.user._id,
      graphData: graphDataForFrontend,
      inputs: {
        textInput: textInput || '',
        question: question || '',
        answer: answer || '',
        imageFileName: files.imageFile ? files.imageFile[0].originalname : '',
        audioFileName: files.audioFile ? files.audioFile[0].originalname : '',
      },
    })
    await historyItem.save()

    res.json({ answer, graphData: graphDataForFrontend })
  } catch (error: any) {
    console.error('Error in graph generation:', error)
    res.status(500).json({ error: 'Failed to generate graph' })
  }
}