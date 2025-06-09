import { Request, Response } from 'express'
import History from '../models/History'
import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import axios from 'axios'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Helper to sanitize and extract graph data from Gemini response
const extractGraphData = (response: string) => {
  let jsonString = ''
  try {
    console.log('Raw Gemini response received:\n', response)
    const jsonMatch = response.match(/```json\s*([\s\S]*?)```/i) || response.match(/```\s*([\s\S]*?)```/i)
    jsonString = jsonMatch ? jsonMatch[1].trim() : response.trim()
    console.log('Attempting to parse JSON string:\n', jsonString)

    const data = JSON.parse(jsonString)
    return {
      nodes: data.entities || [],
      edges: data.relationships || [],
    }
  } catch (error) {
    console.error('Error parsing Gemini response. Raw string was:', jsonString, 'Error:', error)
    return { nodes: [], edges: [] }
  }
}

// Helper to convert buffer to a Gemini-compatible part
const fileToGenerativePart = (file: Express.Multer.File): Part => {
  return {
    inlineData: {
      data: file.buffer.toString('base64'),
      mimeType: file.mimetype,
    },
  }
}

export const generateGraphAndSave = async (req: Request, res: Response) => {
  try {
    const { textInput, audioVideoURL } = req.body
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    let audioPart: Part | null = null
    const hasImage = files.imageFile && files.imageFile.length > 0

    if (files.audioFile && files.audioFile.length > 0) {
      audioPart = fileToGenerativePart(files.audioFile[0])
    } else if (audioVideoURL) {
      try {
        const response = await axios.get(audioVideoURL, { responseType: 'arraybuffer' })
        const mimeType = response.headers['content-type'] || 'application/octet-stream'
        const data = Buffer.from(response.data).toString('base64')
        audioPart = { inlineData: { data, mimeType } }
      } catch (urlError) {
        console.error(`Failed to download from URL: ${audioVideoURL}`, urlError)
      }
    }

    if (!textInput && !hasImage && !audioPart) {
      return res.status(400).json({ error: 'At least one input is required.' })
    }

    const promptMessages = [/*...same prompt logic as before...*/]
    // ... logic to build promptMessages array ...
    
    const textPrompt = `Your primary goal is to build a comprehensive and highly-connected knowledge graph from the provided inputs. Identify *all* plausible entities and the relationships that connect them. It is crucial to be exhaustive.

      The user provided:
      ${textInput ? `Text: "${textInput}"` : ''}
      ${hasImage ? 'An image file.' : ''}
      ${audioPart ? 'An audio/video file.' : ''}

      **Instructions:**
      1.  **Be Exhaustive:** Find every possible entity and relationship. It's better to include a minor relationship than to omit one. Aim for a dense, well-connected graph.
      2.  **Perform Sentiment Analysis:** For every single entity and every single relationship, you MUST determine its sentiment from the context. The sentiment must be one of three string values: "positive", "negative", or "neutral".
      3.  **Strict JSON Output:** Return the output *only* as a single JSON object. Do not include any other text, comments, or formatting.

      Here is the required structure with an example demonstrating a dense graph with varied sentiments:
      {
        "entities": [
          {"id": "e1", "label": "Synapse", "type": "PRODUCT", "sentiment": "positive"},
          {"id": "e2", "label": "Gemini API", "type": "PRODUCT", "sentiment": "neutral"},
          {"id": "e3", "label": "Knowledge Graph", "type": "CONCEPT", "sentiment": "neutral"},
          {"id": "e4", "label": "Frontend Developers", "type": "JOB_TITLE", "sentiment": "positive"}
        ],
        "relationships": [
          {"source": "e1", "target": "e2", "label": "USES", "sentiment": "neutral"},
          {"source": "e1", "target": "e3", "label": "GENERATES", "sentiment": "positive"},
          {"source": "e4", "target": "e1", "label": "DEVELOPS", "sentiment": "neutral"},
          {"source": "e2", "target": "e3", "label": "ENABLES", "sentiment": "positive"}
        ]
      }
      
      Use only the following specific entity types: PERSON, ORG, LOCATION, DATE, EVENT, PRODUCT, CONCEPT, JOB_TITLE, FIELD_OF_STUDY, THEORY, ART_WORK.
    `

    const promptParts: Part[] = [{ text: textPrompt }]
    if (hasImage) promptParts.push(fileToGenerativePart(files.imageFile[0]))
    if (audioPart) promptParts.push(audioPart)
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(promptParts)
    const response = await result.response
    const text = response.text()

    const graphData = extractGraphData(text)

    if (graphData.nodes.length === 0 && graphData.edges.length === 0) {
      return res.status(500).json({ error: 'Failed to parse a valid graph from the AI response.'})
    }

    // Save to history
    const historyItem = new History({
      user: req.user._id,
      graphData,
      inputs: {
        textInput: textInput || '',
        audioVideoURL: audioVideoURL || '',
        imageFileName: files.imageFile ? files.imageFile[0].originalname : '',
        audioFileName: files.audioFile ? files.audioFile[0].originalname : '',
      },
    })
    await historyItem.save()

    res.status(201).json(graphData)
  } catch (error) {
    console.error('Error generating graph:', error)
    res.status(500).json({ error: 'Failed to generate graph' })
  }
} 