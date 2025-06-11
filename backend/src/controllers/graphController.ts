import { Request, Response } from 'express'
import History from '../models/History'
import { GoogleGenerativeAI, Part } from '@google/generative-ai'

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

const extractJson = (text: string) => {
  const match = text.match(/```json\n([\s\S]*?)\n```/)
  return match ? match[1] : null
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

export const generateGraphAndSave = async (req: Request, res: Response) => {
  try {
    const { textInput, question } = req.body
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    let audioPart: Part | null = null
    const hasImage = files.imageFile && files.imageFile.length > 0
    const hasAudio = files.audioFile && files.audioFile.length > 0

    if (hasAudio) {
      audioPart = fileToGenerativePart(files.audioFile[0])
    }

    if (!textInput && !question && !hasImage && !audioPart) {
      return res.status(400).json({ error: 'At least one input is required.' })
    }

    let textPrompt: string

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
      textPrompt = `Your primary goal is to build a comprehensive and highly-connected knowledge graph from the provided inputs. Identify *all* plausible entities and the relationships that connect them. It is crucial to be exhaustive.

      The user provided:
      ${textInput ? `Text: "${textInput}"` : ''}
      ${hasImage ? 'An image file.' : ''}
      ${audioPart ? 'An audio/video file.' : ''}

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
    if (hasImage) promptParts.push(fileToGenerativePart(files.imageFile[0]))
    if (audioPart) promptParts.push(audioPart)

    const result = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent({
      contents: [{ role: 'user', parts: promptParts }],
    })

    const jsonString = extractJson(result.response.text())
    if (!jsonString) {
      return res.status(500).json({ error: 'The AI response was not valid JSON.' })
    }

    const aiResponse = JSON.parse(jsonString)

    // The AI response could be { graph: { ... } } OR { answer: '...', graph: { ... } }
    const graphData = aiResponse.graph || (aiResponse.graphData ? aiResponse.graphData : null)
    const answer = aiResponse.answer || ''

    if (!graphData || !graphData.entities || !graphData.relationships) {
      return res.status(500).json({ error: 'The AI response did not contain valid graph data.' })
    }

    const historyItem = new History({
      user: req.user._id,
      graphData,
      inputs: {
        textInput: textInput || '',
        question: question || '',
        answer: answer || '',
        imageFileName: files.imageFile ? files.imageFile[0].originalname : '',
        audioFileName: files.audioFile ? files.audioFile[0].originalname : '',
      },
    })
    await historyItem.save()

    res.json({ answer, graphData })
  } catch (error: any) {
    console.error('Error in graph generation:', error)
    res.status(500).json({ error: 'Failed to generate graph' })
  }
}