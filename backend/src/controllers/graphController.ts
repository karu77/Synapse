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
    
    const textPrompt = `Analyze the provided inputs to extract key entities and their relationships.
      The user provided:
      ${textInput ? `Text: "${textInput}"` : ''}
      ${hasImage ? 'An image file.' : ''}
      ${audioPart ? 'An audio/video file.' : ''}

      **Crucially, for every single entity and every single relationship you identify, you MUST perform sentiment analysis.** The sentiment value must be one of three specific strings: "positive", "negative", or "neutral", based on the overall context of the input. Do not skip this step.

      Return the output *only* as a single JSON object. Do not include any other text, comments, or formatting. Here is the required structure with an example demonstrating varied sentiments:
      {
        "entities": [
          {"id": "e1", "label": "Amazing Product", "type": "PRODUCT", "sentiment": "positive"},
          {"id": "e2", "label": "Company XYZ", "type": "ORG", "sentiment": "neutral"},
          {"id": "e3", "label": "Terrible Experience", "type": "CONCEPT", "sentiment": "negative"}
        ],
        "relationships": [
          {"source": "e1", "target": "e2", "label": "PRODUCED_BY", "sentiment": "neutral"},
          {"source": "e3", "target": "e1", "label": "DESCRIBES", "sentiment": "negative"}
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