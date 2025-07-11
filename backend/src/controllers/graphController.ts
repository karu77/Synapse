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
      // Parse mind map subtypes
      let actualType = type
      let mindmapSubtype = 'traditional'
      
      if (type.startsWith('mindmap-')) {
        actualType = 'mindmap'
        mindmapSubtype = type.substring('mindmap-'.length)
      }

      // Special handling for flowcharts
      if (actualType === 'flowchart') {
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

- **CRITICAL: Every DECISION node MUST have at least two outgoing edges, typically labeled 'Yes' and 'No'. These edges must represent the branching paths.**

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
- description: A truly comprehensive, in-depth, and exhaustive explanation. Cover all relevant background, context, applications, examples, significance, and technical or historical details. The explanation should be as long and detailed as necessary for a deep understanding, not just a summary.
- properties: Key attributes relevant to the entity
- importance: A number from 1-5 indicating significance
- references: An array of at least 2 real, relevant URLs or objects with label and url, relevant to the node's topic (no placeholders)
- recommendations: An array of at least 2 related topics or next concepts to explore

For relationships, include:
- label: The type of relationship
- description: How the entities are connected (detailed)
- strength: A number from 0-1 indicating relationship strength

WARNING: If you do not include detailed explanations, references, and recommendations for every node, your response will be considered invalid.`,

        'mindmap': getMindmapPrompt(mindmapSubtype),
        'flowchart': `Create a detailed flowchart with clear nodes and logical flows. For each node, include:
- id: unique string
- label: short description
- type: one of the allowed types
- level: REQUIRED integer indicating vertical order (0 = top, higher numbers = lower)
- description: A truly comprehensive, in-depth, and exhaustive explanation. Cover all relevant background, context, applications, examples, significance, and technical or historical details. The explanation should be as long and detailed as necessary for a deep understanding, not just a summary.
- references: An array of at least 2 real, relevant URLs or objects with label and url, relevant to the node's topic (no placeholders)
- recommendations: An array of at least 2 related topics or next concepts to explore

For each edge, specify:
- source: id of the source node
- target: id of the target node
- label: (optional) label for the edge (e.g., "Yes", "No" for decisions)
- description: a detailed explanation of the connection

WARNING: If you do not include detailed explanations, references, and recommendations for every node, your response will be considered invalid.`,
        'sequence': 'Generate a sequence diagram showing detailed interactions between components. ',
        'er-diagram': 'Generate a comprehensive entity-relationship diagram with detailed attributes and relationships. ',
        'timeline': 'Create a detailed timeline of events with dates, descriptions, and significance. ',
        'swimlane': 'Generate a swimlane diagram showing detailed processes across different departments. ',
        'state': 'Create a state diagram showing detailed states and transitions. ',
        'gantt': 'Generate a Gantt chart showing project timeline, tasks, dependencies, and resources. ',
        'venn': 'Create a Venn diagram showing detailed overlapping concepts and relationships. ',
      }[actualType] || 'Generate a detailed diagram with the following structure: ';
      
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
      // Parse mind map subtypes
      let actualType = diagramType
      let mindmapSubtype = 'traditional'
      
      if (diagramType.startsWith('mindmap-')) {
        actualType = 'mindmap'
        mindmapSubtype = diagramType.substring('mindmap-'.length)
      }

      const baseStructures: Record<string, any> = {
        'knowledge-graph': {
          question: {
            answer: "A detailed textual answer to the user's question goes here. IMPORTANT: All double quotes and special characters inside this string must be properly JSON-escaped (e.g., \\\" for a quote, \\n for a newline).",
            graph: {
              entities: [
                {"id": "e1", "label": "Example Entity", "type": "CONCEPT", "sentiment": "neutral", "description": "Example Entity is a foundational concept in computer science and information theory. It originated in the early 20th century as researchers sought to formalize the representation of abstract ideas and their relationships. Over the decades, Example Entity has been applied in various domains, including artificial intelligence, data modeling, and semantic web technologies. Its applications range from structuring knowledge bases to enabling advanced search and reasoning in large datasets. The significance of Example Entity lies in its ability to bridge the gap between human understanding and machine processing, making it a cornerstone of modern knowledge representation. For instance, in the context of ontologies, Example Entity serves as a building block for defining classes, properties, and relationships, facilitating interoperability across systems. The evolution of Example Entity continues as new paradigms in machine learning and data science emerge, further expanding its relevance and utility.", "importance": 5, "properties": {"Attribute": "Value"}, "references": ["https://en.wikipedia.org/wiki/Entity", {"label": "Stanford Encyclopedia of Philosophy: Entity", "url": "https://plato.stanford.edu/entries/entity/"}], "recommendations": ["Ontology", "Knowledge Representation"]}
              ],
              relationships: [
                {"source": "e1", "target": "e2", "label": "IS_RELATED_TO", "sentiment": "neutral", "description": "Example Entity is related to e2 through a shared conceptual framework that underpins both entities. This connection is often explored in the context of semantic networks, where relationships like IS_RELATED_TO enable the mapping of complex interdependencies. For example, in a knowledge graph, this relationship might represent a thematic or functional link, supported by empirical studies and domain-specific literature.", "strength": 0.8}
              ]
            }
          },
          text: {
            graph: {
              entities: [
                {"id": "e1", "label": "Example Entity", "type": "CONCEPT", "sentiment": "neutral", "description": "Example Entity is a foundational concept in computer science and information theory. It originated in the early 20th century as researchers sought to formalize the representation of abstract ideas and their relationships. Over the decades, Example Entity has been applied in various domains, including artificial intelligence, data modeling, and semantic web technologies. Its applications range from structuring knowledge bases to enabling advanced search and reasoning in large datasets. The significance of Example Entity lies in its ability to bridge the gap between human understanding and machine processing, making it a cornerstone of modern knowledge representation. For instance, in the context of ontologies, Example Entity serves as a building block for defining classes, properties, and relationships, facilitating interoperability across systems. The evolution of Example Entity continues as new paradigms in machine learning and data science emerge, further expanding its relevance and utility.", "importance": 4, "properties": {"Key": "Data", "Status": "Complete"}, "references": ["https://en.wikipedia.org/wiki/Entity", {"label": "Stanford Encyclopedia of Philosophy: Entity", "url": "https://plato.stanford.edu/entries/entity/"}], "recommendations": ["Ontology", "Knowledge Representation"]}
              ],
              relationships: [
                {"source": "e1", "target": "e2", "label": "IS_RELATED_TO", "sentiment": "neutral", "description": "Example Entity is related to e2 through a shared conceptual framework that underpins both entities. This connection is often explored in the context of semantic networks, where relationships like IS_RELATED_TO enable the mapping of complex interdependencies. For example, in a knowledge graph, this relationship might represent a thematic or functional link, supported by empirical studies and domain-specific literature.", "strength": 0.7}
              ]
            }
          }
        },
        'flowchart': {
          question: {
            answer: "A detailed textual answer to the user's question goes here. IMPORTANT: All double quotes and special characters inside this string must be properly JSON-escaped (e.g., \\\" for a quote, \\n for a newline).",
            graph: {
              entities: [
                {"id": "start", "label": "Start", "type": "START_END", "sentiment": "neutral", "description": "The Start node marks the initiation of the process. It is essential because it sets the stage for all subsequent actions, ensuring that prerequisites are met and the system is ready for operation. In many systems, the Start node is responsible for initializing variables, allocating resources, and performing safety checks. For example, in a software application, this might involve loading configuration files, establishing database connections, and verifying user credentials. The Start node's role is critical in preventing errors and ensuring a smooth transition to the next phase. Its design often reflects best practices in system engineering, emphasizing reliability and clarity. The importance of a well-defined Start node cannot be overstated, as it directly impacts the efficiency and robustness of the entire process.", "level": 0, "references": ["https://en.wikipedia.org/wiki/Start", {"label": "Start Node Resource", "url": "https://www.geeksforgeeks.org/start-node-in-flowcharts/"}], "recommendations": ["Initialization", "Configuration"]},
                {"id": "step1", "label": "Gather Information", "type": "INPUT_OUTPUT", "sentiment": "neutral", "description": "Gathering information is a pivotal step in any process, as it lays the foundation for informed decision-making. This step involves collecting relevant data from various sources, which may include user input, sensors, databases, or external APIs. The quality and completeness of the gathered information directly influence the accuracy and effectiveness of subsequent actions. For instance, in a medical diagnosis system, gathering comprehensive patient data is crucial for accurate assessment and treatment planning. Techniques such as data validation, error checking, and redundancy are often employed to enhance reliability. The process of gathering information is iterative and may require feedback loops to address gaps or inconsistencies. Ultimately, this step ensures that the system operates on a solid informational basis, reducing the risk of errors and improving outcomes.", "level": 1, "references": ["https://en.wikipedia.org/wiki/Information_gathering", {"label": "Data Collection Methods", "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2657603/"}], "recommendations": ["Data Validation", "User Input"]}
              ],
              relationships: [
                {"source": "start", "target": "step1", "label": "", "sentiment": "neutral", "description": "The transition from the Start node to the Gather Information step is driven by the need to establish a knowledge base before proceeding. This connection ensures that all necessary preparations are complete, minimizing the likelihood of errors in later stages. In practice, this might involve checks for data availability, system readiness, and user authentication. The relationship is foundational, as it underpins the logical flow of the process and supports traceability and accountability.", "strength": 0.9}
              ]
            }
          },
          text: {
            graph: {
              entities: [
                {"id": "start", "label": "Start Program", "type": "START_END", "sentiment": "neutral", "description": "The Start Program node is responsible for initializing the application environment. This includes loading essential libraries, setting up configuration parameters, and performing system checks. In complex systems, this step may also involve security verifications and resource allocation. The thoroughness of this initialization phase determines the stability and performance of the program. For example, in mission-critical applications, rigorous startup procedures are implemented to prevent failures. The Start Program node's effectiveness is often measured by its ability to handle exceptions and recover from errors gracefully. Its design reflects a balance between efficiency and robustness, tailored to the specific requirements of the application domain.", "level": 0, "references": ["https://en.wikipedia.org/wiki/Start", {"label": "Software Initialization", "url": "https://www.ibm.com/docs/en/zos/2.3.0?topic=initialization-software"}], "recommendations": ["Initialization", "Configuration"]}
              ],
              relationships: [
                {"source": "start", "target": "step1", "label": "", "sentiment": "neutral", "description": "The transition from Start Program to the next step is critical for ensuring that all prerequisites are satisfied. This relationship often involves validation checks, resource allocation, and logging. In high-reliability systems, this connection is meticulously designed to support fault tolerance and traceability, providing a clear audit trail for system operations.", "strength": 0.95}
              ]
            }
          }
        },
        'mindmap': getMindmapExampleStructure(mindmapSubtype, hasQuestion)
      }

      const structure = baseStructures[actualType] || baseStructures['knowledge-graph']
      return hasQuestion ? structure.question : structure.text
    }

    // Helper function to get mindmap example structures
    const getMindmapExampleStructure = (mindmapSubtype: string, hasQuestion: boolean) => {
      const baseExample = {
        question: {
          answer: "A detailed textual answer to the user's question goes here. IMPORTANT: All double quotes and special characters inside this string must be properly JSON-escaped (e.g., \\\" for a quote, \\n for a newline).",
          graph: {
            entities: [
              {"id": "center", "label": "Central Topic", "type": "MAIN_TOPIC", "sentiment": "neutral", "description": "The main topic", "level": 0},
              {"id": "branch1", "label": "Main Branch 1", "type": "TOPIC", "sentiment": "neutral", "description": "First major aspect", "level": 1},
              {"id": "branch2", "label": "Main Branch 2", "type": "TOPIC", "sentiment": "neutral", "description": "Second major aspect", "level": 1},
              {"id": "sub1", "label": "Subtopic 1", "type": "SUBTOPIC", "sentiment": "neutral", "description": "Supporting detail", "level": 2},
              {"id": "detail1", "label": "Detail 1", "type": "CONCEPT", "sentiment": "neutral", "description": "Specific detail", "level": 3}
            ],
            relationships: [
              {"source": "center", "target": "branch1", "label": "HAS_BRANCH", "sentiment": "neutral", "description": "Central topic branches to main aspect"},
              {"source": "center", "target": "branch2", "label": "HAS_BRANCH", "sentiment": "neutral", "description": "Central topic branches to main aspect"},
              {"source": "branch1", "target": "sub1", "label": "CONTAINS", "sentiment": "neutral", "description": "Main branch contains subtopic"},
              {"source": "sub1", "target": "detail1", "label": "INCLUDES", "sentiment": "neutral", "description": "Subtopic includes specific detail"}
            ]
          }
        },
        text: {
          graph: {
            entities: [
              {"id": "center", "label": "Central Topic", "type": "MAIN_TOPIC", "sentiment": "neutral", "description": "The main topic", "level": 0},
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
      
      // Customize examples based on mindmap subtype
      const typeSpecificExamples: Record<string, any> = {
        organizational: {
          question: {
            ...baseExample.question,
            graph: {
              entities: [
                {"id": "ceo", "label": "CEO", "type": "MAIN_TOPIC", "sentiment": "neutral", "description": "Chief Executive", "level": 0},
                {"id": "dept1", "label": "Engineering", "type": "TOPIC", "sentiment": "neutral", "description": "Engineering department", "level": 1},
                {"id": "dept2", "label": "Marketing", "type": "TOPIC", "sentiment": "neutral", "description": "Marketing department", "level": 1},
                {"id": "team1", "label": "Frontend Team", "type": "SUBTOPIC", "sentiment": "neutral", "description": "Frontend development", "level": 2},
                {"id": "role1", "label": "Senior Developer", "type": "ROLE", "sentiment": "neutral", "description": "Lead developer role", "level": 3}
              ],
              relationships: [
                {"source": "ceo", "target": "dept1", "label": "MANAGES", "sentiment": "neutral", "description": "Organizational hierarchy"},
                {"source": "ceo", "target": "dept2", "label": "MANAGES", "sentiment": "neutral", "description": "Organizational hierarchy"},
                {"source": "dept1", "target": "team1", "label": "CONTAINS", "sentiment": "neutral", "description": "Department structure"},
                {"source": "team1", "target": "role1", "label": "INCLUDES", "sentiment": "neutral", "description": "Team roles"}
              ]
            }
          }
        }
      }
      
      if (typeSpecificExamples[mindmapSubtype]) {
        const customExample = typeSpecificExamples[mindmapSubtype]
        return hasQuestion ? customExample.question : (customExample.text || customExample.question)
      }
      
      return hasQuestion ? baseExample.question : baseExample.text
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
    // Check for mindmap wrapper format, as the AI sometimes adds this
    else if (aiResponse.mindmap && typeof aiResponse.mindmap === 'object') {
      console.log('Detected mindmap wrapper format');
      const mindmapContent = aiResponse.mindmap;
      if (mindmapContent.graph && typeof mindmapContent.graph === 'object') {
        graphData = mindmapContent.graph;
        answer = mindmapContent.answer || '';
      } else {
        // Fallback for direct entities/relationships inside mindmap wrapper
        graphData = {
          nodes: mindmapContent.entities || [],
          edges: mindmapContent.relationships || [],
        };
        answer = mindmapContent.answer || '';
      }
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

    // Ensure every node has references and recommendations
    nodes = nodes.map((node: any) => {
      let changed = false;
      if (!Array.isArray(node.references) || node.references.length === 0) {
        node.references = ["No references available"];
        changed = true;
      }
      if (!Array.isArray(node.recommendations) || node.recommendations.length === 0) {
        node.recommendations = ["No recommendations available"];
        changed = true;
      }
      if (changed) {
        console.warn(`AI omitted references or recommendations for node: ${node.label || node.id}`);
      }
      return node;
    });

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
    const isHierarchical = (diagramType.startsWith('flowchart') || diagramType.startsWith('mindmap')) && diagramType !== 'mindmap-radial'
    if (isHierarchical) {
      // For hierarchical layouts, ensure ALL nodes have a level property
      nodes = nodes.map((node: any) => ({
        ...node,
        level: node.level !== undefined ? node.level : 0
      }))
    } else {
      // For non-hierarchical layouts (knowledge graphs, radial mindmaps), REMOVE the level property
      nodes = nodes.map((node: any) => {
        const { level, ...nodeWithoutLevel } = node
        return nodeWithoutLevel
      })
    }

    // PATCH: Always return { nodes, edges, diagramType } to the frontend
    // For mind map subtypes, store the base type for frontend compatibility
    const frontendDiagramType = diagramType.startsWith('mindmap-') ? 'mindmap' : diagramType
    const graphDataForFrontend = {
      nodes,
      edges,
      diagramType: frontendDiagramType,
      mindmapSubtype: diagramType.startsWith('mindmap-') ? diagramType.split('-')[1] : undefined,
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

// Helper function to get mind map prompts for different structures
const getMindmapPrompt = (mindmapSubtype: string): string => {
  const prompts: Record<string, string> = {
    traditional: `Create a traditional mind map with a strict hierarchical structure, designed to branch from left to right.
- The structure MUST be a tree, starting with a single MAIN_TOPIC node.
- All other nodes must be descendants of this MAIN_TOPIC node.
- For EACH node, you must include:
  - id: a unique identifier string.
  - label: a short, clear title for the node.
  - type: one of MAIN_TOPIC, TOPIC, SUBTOPIC, or CONCEPT.
  - description: a one-sentence explanation of the node's content.
  - level: the correct hierarchy level (MAIN_TOPIC is 0, TOPICs are 1, etc.).
  - importance: a number from 1 (least) to 5 (most) indicating its significance.
- The layout should be wide, not deep. Prefer adding more branches over deeply nested chains.

The final output must be a single, raw JSON object containing "entities" and "relationships" arrays, wrapped in a "graph" object. Do not create circular relationships. The graph must be a directed acyclic graph.`,

    radial: `Create a radial mind map with a simple star-like structure.
- CRITICAL: The graph MUST have exactly ONE central node of type 'MAIN_TOPIC'. All other nodes are secondary.
- All secondary nodes MUST have the type 'CHILD_TOPIC'.
- EVERY 'CHILD_TOPIC' node MUST connect directly to the central 'MAIN_TOPIC' node.
- VERY IMPORTANT: Do NOT create any connections between 'CHILD_TOPIC' nodes. The graph must be a simple star shape where all lines radiate from the center.
- For EACH node, you must include:
  - id: a unique identifier string.
  - label: a short, clear title for the node.
  - type: 'MAIN_TOPIC' or 'CHILD_TOPIC'.
  - description: a one-sentence explanation of the node's content.
  - importance: a number from 1 (most important) to 5 (least important).
- CRITICAL: Do NOT include a 'level' property in the nodes. The layout is purely physics-based and non-hierarchical.

The final output must be a single, raw JSON object containing "entities" and "relationships" arrays, wrapped in a "graph" object.`,

    organizational: `Create an organizational-style mind map with a top-down hierarchical structure.
- For EACH node, you must include:
  - id: a unique identifier string.
  - label: a short, clear title for the node.
  - type: one of MAIN_TOPIC, TOPIC, SUBTOPIC, CONCEPT, ROLE, FUNCTION, GOAL, or METRIC.
  - description: a one-sentence explanation of the node's content.
  - level: the correct hierarchy level.
  - importance: a number from 1 (least) to 5 (most) indicating its significance.
- The structure should flow top-down with clear reporting lines.

The final output must be a single, raw JSON object containing "entities" and "relationships" arrays, wrapped in a "graph" object.`,

    'concept-map': `Create a concept map with interconnected relationships, focusing on how ideas connect.
- For EACH node, you must include:
  - id: a unique identifier string.
  - label: a short, clear title for the node.
  - type: one of MAIN_TOPIC, TOPIC, SUBTOPIC, CONCEPT, PRINCIPLE, THEORY, EXAMPLE, or CONNECTION.
  - description: a one-sentence explanation of the node's content.
  - level: the correct hierarchy level.
  - importance: a number from 1 (least) to 5 (most) indicating its significance.
- Focus on showing how concepts relate to and influence each other.

The final output must be a single, raw JSON object containing "entities" and "relationships" arrays, wrapped in a "graph" object.`,

    timeline: `Create a timeline-based mind map with a chronological structure from left to right.
- For EACH node, you must include:
  - id: a unique identifier string.
  - label: a short, clear title for the node.
  - type: one of MAIN_TOPIC, TOPIC, SUBTOPIC, CONCEPT, DATE, EVENT, MILESTONE, or PERIOD.
  - description: a one-sentence explanation of the node's content.
  - level: the correct hierarchy level.
  - importance: a number from 1 (least) to 5 (most) indicating its significance.
- The structure should show progression and development over time.

The final output must be a single, raw JSON object containing "entities" and "relationships" arrays, wrapped in a "graph" object.`,
  }
  
  return prompts[mindmapSubtype] || prompts.traditional
}