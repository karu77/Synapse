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

  // Check if the response is a Mermaid diagram instead of JSON
  // Only check for strong Mermaid indicators that won't appear in normal JSON content
  const strongMermaidIndicators = [
    '```mermaid',
    'graph TD',
    'graph LR', 
    'graph TB',
    'graph BT',
    'graph RL',
    'flowchart TD',
    'flowchart LR',
    'flowchart TB',
    'flowchart BT',
    'flowchart RL',
    'subgraph'
  ]
  
  const lowerText = text.toLowerCase()
  const hasStrongMermaidSyntax = strongMermaidIndicators.some(indicator => 
    lowerText.includes(indicator.toLowerCase())
  )
  
  // Additional check: if it starts with ```mermaid or contains graph/flowchart keywords at the beginning
  const startsWithMermaid = lowerText.trim().startsWith('```mermaid') || 
    lowerText.trim().startsWith('graph ') || 
    lowerText.trim().startsWith('flowchart ')
  
  if (hasStrongMermaidSyntax || startsWithMermaid) {
    console.error('AI returned a Mermaid diagram instead of JSON format')
    console.error('Detected Mermaid indicators in response:', 
      strongMermaidIndicators.filter(indicator => lowerText.includes(indicator.toLowerCase()))
    )
    return null
  }

  try {
    // Try to extract JSON from a code block (```json ... ```) or (``` ...)
    let jsonString = text.trim()
    
    // First check for JSON code blocks
    const jsonCodeBlockMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/i)
    if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
      jsonString = jsonCodeBlockMatch[1].trim()
    } else {
      // Check for generic code blocks that might contain JSON
      const codeBlockMatch = jsonString.match(/```(?!mermaid|html|css|javascript|python|java|cpp|c\+\+)\s*([\s\S]*?)\s*```/i)
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
    }

    // Clean up the JSON string more thoroughly
    const cleanJsonString = jsonString
      .replace(/^[^{[]*([{\[])/, '$1')  // Remove any text before the first { or [
      .replace(/([}\]])[^}\]]*$/, '$1') // Remove any text after the last } or ]
      .replace(/[\u2018\u2019]/g, "'")  // Replace smart quotes with straight quotes
      .replace(/[\u201C\u201D]/g, '"')  // Replace smart double quotes
      .replace(/,\s*([}\]])/g, '$1')    // Remove trailing commas before } or ]
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys

    console.log('Attempting to parse cleaned JSON:', cleanJsonString.substring(0, 200) + '...')
    return JSON.parse(cleanJsonString)
  } catch (error) {
    console.error('Failed to parse JSON:', error)
    console.error('Original text length:', text.length)
    console.error('Problematic text (first 1000 chars):', text.substring(0, 1000))
    
    // Try one more time with a more aggressive cleanup
    try {
      let fallbackJson = text.trim()
      
      // Look for the main JSON structure patterns
      const patterns = [
        /\{[\s\S]*"entities"[\s\S]*"relationships"[\s\S]*\}/,
        /\{[\s\S]*"nodes"[\s\S]*"edges"[\s\S]*\}/,
        /\{[\s\S]*"graph"[\s\S]*\}/,
        /\{[\s\S]*"answer"[\s\S]*\}/
      ]
      
      for (const pattern of patterns) {
        const match = fallbackJson.match(pattern)
        if (match) {
          const cleanMatch = match[0]
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
          
          console.log('Trying fallback pattern match...')
          return JSON.parse(cleanMatch)
        }
      }
      
      return null
    } catch (fallbackError) {
      console.error('Fallback parsing also failed:', fallbackError)
      return null
    }
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
    const { textInput, question, imageUrl, audioUrl, diagramType = 'knowledge-graph' } = req.body
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

    // Function to generate prompt based on diagram type
    const generatePromptForDiagramType = (
      type: string,
      hasQuestion: boolean,
      input: string,
      hasImage: boolean,
      hasAudio: boolean
    ): string => {
      // Special handling for flowcharts
      if (type === 'flowchart') {
        return `You are to generate a detailed flowchart for the process described below.

**Flowchart Requirements:**
- The flowchart must start at the top (with a Start/End node) and end at the bottom (with a Start/End node).
- Use the following shapes/types for nodes, based on their meaning:
  - START_END: Oval (Start/End)
  - PROCESS: Rectangle (Action or Process)
  - DOCUMENT: Document shape
  - DECISION: Diamond (Decision/Branch)
  - INPUT_OUTPUT: Parallelogram (Input/Output)
  - CONNECTOR: Circle (Connector)
  - DELAY: Delay shape
  - MERGE: Triangle (Merge)
  - COLLATE: Collate shape
  - SORT: Sort shape
  - SUBROUTINE: Double rectangle (Subroutine)
  - MANUAL_LOOP: Manual loop shape
  - LOOP_LIMIT: Loop limit shape
  - DATA_STORAGE: Data storage shape
  - DATABASE: Database shape
  - DISPLAY: Display shape
  - OFF_PAGE: Off-page connector

- For each node, specify:
  - id: unique string
  - label: short description
  - type: one of the above types
  - level: REQUIRED integer indicating vertical order (0 = top, higher numbers = lower)
  - (optional) description: longer explanation

- For each edge, specify:
  - source: id of the source node
  - target: id of the target node
  - label: (optional) label for the edge (e.g., "Yes", "No" for decisions)

- CRITICAL: The flow should be vertical (top to bottom). ALWAYS include a 'level' property for each node to ensure proper vertical ordering.
- **Critically analyze the process and use the most specific and appropriate shape for each step from the list provided. Avoid defaulting to the 'PROCESS' type for every step unless it is truly just a process step.**

**Return ONLY a JSON object with arrays "nodes" and "edges". Do NOT include markdown, code blocks, or explanations.**

**Example:**
{
  "nodes": [
    { "id": "start", "label": "Start", "type": "START_END", "level": 0 },
    { "id": "input", "label": "Get User Input", "type": "INPUT_OUTPUT", "level": 1 },
    { "id": "decision", "label": "Is Input Valid?", "type": "DECISION", "level": 2 },
    { "id": "process", "label": "Process Data", "type": "PROCESS", "level": 3 },
    { "id": "end", "label": "End", "type": "START_END", "level": 4 }
  ],
  "edges": [
    { "source": "start", "target": "input" },
    { "source": "input", "target": "decision" },
    { "source": "decision", "target": "process", "label": "Yes" },
    { "source": "decision", "target": "input", "label": "No" },
    { "source": "process", "target": "end" }
  ]
}

Process to visualize:
${input}
`;
      }
      
      // General handling for other diagram types
      const basePrompt = hasQuestion
        ? `Answer the following question in detail: ${input}\n\n`
        : `Analyze the following text comprehensively: ${input}\n\n`;
      
      const visualContext = [];
      if (hasImage) visualContext.push('image data');
      if (hasAudio) visualContext.push('audio data');
      
      const contextPrompt = visualContext.length > 0
        ? `Carefully analyze and incorporate the provided ${visualContext.join(' and ')} as additional context.\n\n`
        : '';
      
      const diagramSpecificPrompt = {
        'knowledge-graph': `Generate a comprehensive knowledge graph with detailed entities and meaningful relationships. For each entity, include:
- type: One of PERSON, GROUP, ROLE, ORG, COMPANY, GOVERNMENT, NONPROFIT, LOCATION, CITY, COUNTRY, REGION, EVENT, MEETING, CONFERENCE, MILESTONE, CONCEPT, IDEA, PRINCIPLE, THEORY, OBJECT, PRODUCT, DOCUMENT, TOOL, DATE, PERIOD, METRIC, GOAL, PROBLEM, or SOLUTION
- label: A clear, descriptive name
- description: A detailed explanation (2-3 sentences)
- properties: Key attributes relevant to the entity
- importance: A number from 1-5 indicating significance

For relationships, include:
- label: The type of relationship
- description: How the entities are connected
- strength: A number from 0-1 indicating relationship strength`,

        'mindmap': `Create a detailed mind map with a central concept and well-structured branches. Include:
- MAIN_TOPIC: The central concept (most important)
- TOPIC: Main branches (key themes)
- SUBPOINT: Supporting details
- NOTE: Additional information or examples
- TASK: Action items or to-dos
- QUESTION: Open questions or areas needing clarification
- IDEA: Creative suggestions or possibilities
- DECISION: Important choices or conclusions
- PRO/CON: Advantages and disadvantages
- SUMMARY: Key takeaways or synthesis`,

        'flowchart': 'Create a detailed flowchart with clear nodes and logical flows. ',
        'sequence': 'Generate a sequence diagram showing detailed interactions between components. ',
        'er-diagram': 'Generate a comprehensive entity-relationship diagram with detailed attributes and relationships. ',
        'timeline': 'Create a detailed timeline of events with dates, descriptions, and significance. ',
        'swimlane': 'Generate a swimlane diagram showing detailed processes across different departments. ',
        'state': 'Create a state diagram showing detailed states and transitions. ',
        'gantt': 'Generate a Gantt chart showing project timeline, tasks, dependencies, and resources. ',
        'venn': 'Create a Venn diagram showing detailed overlapping concepts and relationships. ',
      }[type] || 'Generate a detailed diagram with the following structure: ';
      
      return basePrompt + contextPrompt + diagramSpecificPrompt;
    }



    // Ensure diagramType is always a string
    const safeDiagramType = diagramType || 'knowledge-graph';
    const safeQuestion = question || '';
    const safeTextInput = textInput || '';
    const safeHasImage = !!hasImage;
    const safeHasAudio = !!audioPart;
    const userInput = safeQuestion || safeTextInput || '';

    // Generate appropriate prompt based on diagram type
    textPrompt = generatePromptForDiagramType(
      safeDiagramType,
      !!safeQuestion,
      userInput,
      safeHasImage,
      safeHasAudio
    )

    const getExampleStructure = (diagramType: string, hasQuestion: boolean) => {
      const baseStructures: Record<string, any> = {
        'knowledge-graph': {
          question: {
            answer: "A detailed textual answer to the user's question goes here. IMPORTANT: All double quotes and special characters inside this string must be properly JSON-escaped (e.g., \\\" for a quote, \\n for a newline).",
            graph: {
              entities: [
                {"id": "e1", "label": "Example Entity", "type": "CONCEPT", "sentiment": "neutral", "description": "A brief summary or definition of the entity.", "importance": 5, "properties": {"Attribute": "Value"}}
              ],
              relationships: [
                {"source": "e1", "target": "e2", "label": "IS_RELATED_TO", "sentiment": "neutral", "description": "What connects the two nodes."}
              ]
            }
          },
          text: {
            graph: {
              entities: [
                {"id": "e1", "label": "Example Entity", "type": "CONCEPT", "sentiment": "neutral", "description": "A brief summary or definition of the entity.", "importance": 4, "properties": {"Key": "Data", "Status": "Complete"}}
              ],
              relationships: [
                {"source": "e1", "target": "e2", "label": "IS_RELATED_TO", "sentiment": "neutral", "description": "What connects the two nodes."}
              ]
            }
          }
        },
        'flowchart': {
          question: {
            answer: "A detailed textual answer to the user's question goes here. IMPORTANT: All double quotes and special characters inside this string must be properly JSON-escaped (e.g., \\\" for a quote, \\n for a newline).",
            graph: {
              entities: [
                {"id": "start", "label": "Start", "type": "START_END", "sentiment": "neutral", "description": "Beginning of the process", "level": 0},
                {"id": "step1", "label": "Gather Information", "type": "INPUT_OUTPUT", "sentiment": "neutral", "description": "Collect required information", "level": 1},
                {"id": "step2", "label": "Analyze Data", "type": "PROCESS", "sentiment": "neutral", "description": "Process the information", "level": 2},
                {"id": "decision1", "label": "Is Data Complete?", "type": "DECISION", "sentiment": "neutral", "description": "Check if all required data is available", "level": 3},
                {"id": "step3", "label": "Generate Solution", "type": "PROCESS", "sentiment": "neutral", "description": "Create the solution or answer", "level": 4},
                {"id": "display1", "label": "Present Result", "type": "DISPLAY", "sentiment": "neutral", "description": "Show the final result", "level": 5},
                {"id": "end", "label": "End", "type": "START_END", "sentiment": "neutral", "description": "End of the process", "level": 6}
              ],
              relationships: [
                {"source": "start", "target": "step1", "label": "", "sentiment": "neutral", "description": "Begin process"},
                {"source": "step1", "target": "step2", "label": "", "sentiment": "neutral", "description": "Move to analysis"},
                {"source": "step2", "target": "decision1", "label": "", "sentiment": "neutral", "description": "Check data completeness"},
                {"source": "decision1", "target": "step3", "label": "Yes", "sentiment": "neutral", "description": "Data is complete", "condition": "yes"},
                {"source": "decision1", "target": "step1", "label": "No", "sentiment": "neutral", "description": "Need more data", "condition": "no"},
                {"source": "step3", "target": "display1", "label": "", "sentiment": "neutral", "description": "Present solution"},
                {"source": "display1", "target": "end", "label": "", "sentiment": "neutral", "description": "Complete process"}
              ]
            }
          },
          text: {
            graph: {
              entities: [
                {"id": "start", "label": "Start Program", "type": "START_END", "sentiment": "neutral", "description": "Program execution begins", "level": 0},
                {"id": "import1", "label": "Import Libraries", "type": "PROCESS", "sentiment": "neutral", "description": "Load required modules", "level": 1},
                {"id": "init1", "label": "Initialize Variables", "type": "PROCESS", "sentiment": "neutral", "description": "Set up program variables", "level": 2},
                {"id": "main_entry", "label": "Enter Main Function", "type": "PROCESS", "sentiment": "neutral", "description": "Begin main program logic", "level": 3},
                {"id": "input1", "label": "Get User Input", "type": "INPUT_OUTPUT", "sentiment": "neutral", "description": "Receive data from user", "level": 4},
                {"id": "validate", "label": "Is Input Valid?", "type": "DECISION", "sentiment": "neutral", "description": "Check input validity", "level": 5},
                {"id": "error_msg", "label": "Display Error Message", "type": "DISPLAY", "sentiment": "neutral", "description": "Show error to user", "level": 4},
                {"id": "process1", "label": "Process Input Data", "type": "PROCESS", "sentiment": "neutral", "description": "Transform input data", "level": 6},
                {"id": "calc1", "label": "Perform Calculations", "type": "PROCESS", "sentiment": "neutral", "description": "Execute mathematical operations", "level": 7},
                {"id": "loop_init", "label": "Initialize Loop Counter", "type": "PROCESS", "sentiment": "neutral", "description": "Set up iteration variable", "level": 8},
                {"id": "loop_check", "label": "Counter < Limit?", "type": "DECISION", "sentiment": "neutral", "description": "Check loop condition", "level": 9},
                {"id": "loop_body", "label": "Execute Loop Body", "type": "PROCESS", "sentiment": "neutral", "description": "Perform loop operations", "level": 10},
                {"id": "loop_increment", "label": "Increment Counter", "type": "PROCESS", "sentiment": "neutral", "description": "Update loop variable", "level": 11},
                {"id": "func_call", "label": "Call Helper Function", "type": "SUBROUTINE", "sentiment": "neutral", "description": "Execute external function", "level": 12},
                {"id": "result_check", "label": "Result Available?", "type": "DECISION", "sentiment": "neutral", "description": "Check if processing succeeded", "level": 13},
                {"id": "format_output", "label": "Format Results", "type": "PROCESS", "sentiment": "neutral", "description": "Prepare output data", "level": 14},
                {"id": "display_result", "label": "Display Results", "type": "DISPLAY", "sentiment": "neutral", "description": "Show final output", "level": 15},
                {"id": "cleanup", "label": "Cleanup Resources", "type": "PROCESS", "sentiment": "neutral", "description": "Free memory and resources", "level": 16},
                {"id": "end", "label": "End Program", "type": "START_END", "sentiment": "neutral", "description": "Program execution ends", "level": 17}
              ],
              relationships: [
                {"source": "start", "target": "import1", "label": "", "sentiment": "neutral", "description": "Begin execution"},
                {"source": "import1", "target": "init1", "label": "", "sentiment": "neutral", "description": "Setup phase"},
                {"source": "init1", "target": "main_entry", "label": "", "sentiment": "neutral", "description": "Enter main logic"},
                {"source": "main_entry", "target": "input1", "label": "", "sentiment": "neutral", "description": "Get input"},
                {"source": "input1", "target": "validate", "label": "", "sentiment": "neutral", "description": "Validate input"},
                {"source": "validate", "target": "error_msg", "label": "No", "sentiment": "neutral", "description": "Invalid input", "condition": "no"},
                {"source": "error_msg", "target": "input1", "label": "", "sentiment": "neutral", "description": "Retry input"},
                {"source": "validate", "target": "process1", "label": "Yes", "sentiment": "neutral", "description": "Valid input", "condition": "yes"},
                {"source": "process1", "target": "calc1", "label": "", "sentiment": "neutral", "description": "Continue processing"},
                {"source": "calc1", "target": "loop_init", "label": "", "sentiment": "neutral", "description": "Setup iteration"},
                {"source": "loop_init", "target": "loop_check", "label": "", "sentiment": "neutral", "description": "Check condition"},
                {"source": "loop_check", "target": "loop_body", "label": "Yes", "sentiment": "neutral", "description": "Continue loop", "condition": "yes"},
                {"source": "loop_body", "target": "loop_increment", "label": "", "sentiment": "neutral", "description": "Update counter"},
                {"source": "loop_increment", "target": "loop_check", "label": "", "sentiment": "neutral", "description": "Check again"},
                {"source": "loop_check", "target": "func_call", "label": "No", "sentiment": "neutral", "description": "Exit loop", "condition": "no"},
                {"source": "func_call", "target": "result_check", "label": "", "sentiment": "neutral", "description": "Check result"},
                {"source": "result_check", "target": "format_output", "label": "Yes", "sentiment": "neutral", "description": "Success", "condition": "yes"},
                {"source": "result_check", "target": "error_msg", "label": "No", "sentiment": "neutral", "description": "Error occurred", "condition": "no"},
                {"source": "format_output", "target": "display_result", "label": "", "sentiment": "neutral", "description": "Show output"},
                {"source": "display_result", "target": "cleanup", "label": "", "sentiment": "neutral", "description": "Clean up"},
                {"source": "cleanup", "target": "end", "label": "", "sentiment": "neutral", "description": "Finish program"}
              ]
            }
          }
        },
        'mindmap': {
          question: {
            answer: "A detailed textual answer to the user's question goes here. IMPORTANT: All double quotes and special characters inside this string must be properly JSON-escaped (e.g., \\\" for a quote, \\n for a newline).",
            graph: {
              entities: [
                {"id": "center", "label": "Central Topic", "type": "TOPIC", "sentiment": "neutral", "description": "The main topic", "level": 0},
                {"id": "branch1", "label": "Main Branch 1", "type": "TOPIC", "sentiment": "neutral", "description": "First major aspect", "level": 1},
                {"id": "branch2", "label": "Main Branch 2", "type": "TOPIC", "sentiment": "neutral", "description": "Second major aspect", "level": 1},
                {"id": "branch3", "label": "Main Branch 3", "type": "TOPIC", "sentiment": "neutral", "description": "Third major aspect", "level": 1},
                {"id": "sub1a", "label": "Subtopic 1A", "type": "SUBTOPIC", "sentiment": "neutral", "description": "First subtopic of branch 1", "level": 2},
                {"id": "sub1b", "label": "Subtopic 1B", "type": "SUBTOPIC", "sentiment": "neutral", "description": "Second subtopic of branch 1", "level": 2},
                {"id": "sub2a", "label": "Subtopic 2A", "type": "SUBTOPIC", "sentiment": "neutral", "description": "First subtopic of branch 2", "level": 2},
                {"id": "detail1", "label": "Detail 1", "type": "CONCEPT", "sentiment": "neutral", "description": "Specific detail", "level": 3},
                {"id": "detail2", "label": "Detail 2", "type": "CONCEPT", "sentiment": "neutral", "description": "Another specific detail", "level": 3}
              ],
              relationships: [
                {"source": "center", "target": "branch1", "label": "HAS_BRANCH", "sentiment": "neutral", "description": "Central topic branches to main aspect"},
                {"source": "center", "target": "branch2", "label": "HAS_BRANCH", "sentiment": "neutral", "description": "Central topic branches to main aspect"},
                {"source": "center", "target": "branch3", "label": "HAS_BRANCH", "sentiment": "neutral", "description": "Central topic branches to main aspect"},
                {"source": "branch1", "target": "sub1a", "label": "CONTAINS", "sentiment": "neutral", "description": "Main branch contains subtopic"},
                {"source": "branch1", "target": "sub1b", "label": "CONTAINS", "sentiment": "neutral", "description": "Main branch contains subtopic"},
                {"source": "branch2", "target": "sub2a", "label": "CONTAINS", "sentiment": "neutral", "description": "Main branch contains subtopic"},
                {"source": "sub1a", "target": "detail1", "label": "INCLUDES", "sentiment": "neutral", "description": "Subtopic includes specific detail"},
                {"source": "sub1b", "target": "detail2", "label": "INCLUDES", "sentiment": "neutral", "description": "Subtopic includes specific detail"}
              ]
            }
          },
          text: {
            graph: {
              entities: [
                {"id": "center", "label": "Central Topic", "type": "TOPIC", "sentiment": "neutral", "description": "The main topic", "level": 0},
                {"id": "branch1", "label": "Main Branch 1", "type": "TOPIC", "sentiment": "neutral", "description": "A major aspect", "level": 1},
                {"id": "branch2", "label": "Main Branch 2", "type": "TOPIC", "sentiment": "neutral", "description": "Another major aspect", "level": 1},
                {"id": "sub1", "label": "Subtopic", "type": "SUBTOPIC", "sentiment": "neutral", "description": "A subtopic", "level": 2},
                {"id": "detail1", "label": "Detail", "type": "CONCEPT", "sentiment": "neutral", "description": "Specific detail", "level": 3}
              ],
              relationships: [
                {"source": "center", "target": "branch1", "label": "HAS_BRANCH", "sentiment": "neutral", "description": "Central topic branches to main aspect"},
                {"source": "center", "target": "branch2", "label": "HAS_BRANCH", "sentiment": "neutral", "description": "Central topic branches to main aspect"},
                {"source": "branch1", "target": "sub1", "label": "CONTAINS", "sentiment": "neutral", "description": "Main branch contains subtopic"},
                {"source": "sub1", "target": "detail1", "label": "INCLUDES", "sentiment": "neutral", "description": "Subtopic includes specific detail"}
              ]
            }
          }
        }
      }

      const structure = baseStructures[diagramType] || baseStructures['knowledge-graph']
      return hasQuestion ? structure.question : structure.text
    }

    const fullPrompt = `${textPrompt}

      Here is the required JSON structure for ${diagramType}:
      ${JSON.stringify(getExampleStructure(diagramType, !!question), null, 2)}

      FINAL REMINDER: Your response must be ONLY the JSON object above. Do not include any explanations, markdown formatting, code blocks, or Mermaid syntax. Just the raw JSON that can be parsed directly.
    `

    const promptParts: Part[] = [{ text: fullPrompt }]
    if (imagePart) promptParts.push(imagePart)
    if (audioPart) promptParts.push(audioPart)

    const result = await genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }).generateContent({
      contents: [{ role: 'user', parts: promptParts }],
    })

    const rawResponse = result.response.text()
    console.log('Raw AI response length:', rawResponse.length)
    console.log('Raw AI response preview:', rawResponse.substring(0, 500) + '...')
    
    const aiResponse = extractJson(rawResponse)
    if (!aiResponse) {
      console.error('Failed to extract JSON from AI response')
      
      // Check if AI returned Mermaid format and provide specific error
      if (rawResponse.includes('```mermaid') || rawResponse.includes('graph TD') || rawResponse.includes('graph LR')) {
        return res.status(500).json({ 
          error: 'The AI returned a diagram in Mermaid format instead of the required JSON format.',
          details: 'Please try again. The system is designed to return structured data, not diagram syntax.',
          rawResponsePreview: rawResponse.substring(0, 500)
        })
      }
      
      return res.status(500).json({ 
        error: 'The AI response was not valid JSON.',
        details: 'Could not parse the response into valid JSON format. The AI may have returned malformed data.',
        rawResponsePreview: rawResponse.substring(0, 1000)
      })
    }

    // Log the raw AI response for debugging
    console.log('Raw AI response:', JSON.stringify(aiResponse, null, 2));
    
    // The AI response could be in multiple formats:
    // 1. { nodes: [...], edges: [...] } (direct format)
    // 2. { graph: { nodes: [...], edges: [...] } }
    // 3. { answer: '...', graph: { ... } }
    // 4. { entities: [...], relationships: [...] } (legacy format)
    
    console.log('Raw AI response type:', typeof aiResponse);
    console.log('AI response keys:', Object.keys(aiResponse));
    
    let graphData = null;
    let answer = '';
    
    // Check for direct nodes/edges format first
    if (Array.isArray(aiResponse.nodes) && Array.isArray(aiResponse.edges)) {
      console.log('Detected direct nodes/edges format');
      graphData = aiResponse;
    } 
    // Check for graph wrapper format
    else if (aiResponse.graph && typeof aiResponse.graph === 'object') {
      console.log('Detected graph wrapper format');
      graphData = aiResponse.graph;
      answer = aiResponse.answer || '';
    } 
    // Check for legacy entities/relationships format
    else if (Array.isArray(aiResponse.entities) && Array.isArray(aiResponse.relationships)) {
      console.log('Detected legacy entities/relationships format');
      graphData = {
        nodes: aiResponse.entities,
        edges: aiResponse.relationships
      };
    }
    
    console.log('Extracted graphData:', graphData ? 'found' : 'not found');
    console.log('Extracted answer:', answer || 'empty');

    // If we still don't have graph data but have an answer, try to extract graph from answer text
    if (!graphData && answer) {
      console.log('Attempting to extract graph from answer text');
      const extracted = extractGraphData(answer);
      if (extracted.nodes.length > 0 || extracted.edges.length > 0) {
        graphData = { 
          nodes: extracted.nodes, 
          edges: extracted.edges 
        };
      }
    }

    // Initialize nodes and edges
    let nodes = [];
    let edges = [];
    
    // Extract nodes and edges from the graph data if available
    if (graphData) {
      if (Array.isArray(graphData.nodes) && Array.isArray(graphData.edges)) {
        nodes = graphData.nodes;
        edges = graphData.edges;
      } else if (Array.isArray(graphData.entities) && Array.isArray(graphData.relationships)) {
        nodes = graphData.entities;
        edges = graphData.relationships;
      }
    }

    if (!nodes.length || !edges.length) {
      console.error('Invalid graph data structure:', {
        nodesLength: nodes.length,
        edgesLength: edges.length,
        graphDataKeys: graphData ? Object.keys(graphData) : 'no graphData',
        aiResponseKeys: Object.keys(aiResponse)
      });
      return res.status(500).json({ 
        error: 'The AI response did not contain valid graph data.',
        details: {
          receivedFormat: {
            hasGraph: !!graphData,
            hasNodes: nodes.length > 0,
            hasEdges: edges.length > 0,
            responseKeys: Object.keys(aiResponse)
          },
          expectedFormats: [
            '{ graph: { nodes: [...], edges: [...] } }',
            '{ answer: "...", graph: { ... } }',
            '{ entities: [...], relationships: [...] }'
          ]
        }
      })
    }

    // Ensure every edge has a unique, stable id
    const edgeIdSet = new Set()
    edges = edges.map((edge: any) => {
      let baseId = `${edge.source || edge.from}-${edge.target || edge.to}-${edge.label || 'REL'}`
      // Remove spaces and special chars for safety
      baseId = baseId.replace(/[^a-zA-Z0-9_-]/g, '')
      let uniqueId = baseId
      let suffix = 1
      while (edgeIdSet.has(uniqueId)) {
        uniqueId = `${baseId}-${suffix}`
        suffix++
      }
      edgeIdSet.add(uniqueId)
      return { ...edge, id: uniqueId }
    })

    // Ensure level consistency for hierarchical layouts
    if (diagramType === 'flowchart' || diagramType === 'mindmap') {
      // For hierarchical layouts, ensure ALL nodes have a level property
      nodes = nodes.map((node: any) => ({
        ...node,
        level: node.level !== undefined ? node.level : 0
      }))
    } else {
      // For knowledge graphs, remove level property to avoid conflicts
      nodes = nodes.map((node: any) => {
        const { level, ...nodeWithoutLevel } = node
        return nodeWithoutLevel
      })
    }

    // PATCH: Always return { nodes, edges, diagramType } to the frontend
    const graphDataForFrontend = {
      nodes,
      edges,
      diagramType,
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
        diagramType: diagramType,
      },
    })
    await historyItem.save()

    res.json({ answer, graphData: graphDataForFrontend })
  } catch (error: any) {
    console.error('Error in graph generation:', error)
    res.status(500).json({ error: 'Failed to generate graph' })
  }
}