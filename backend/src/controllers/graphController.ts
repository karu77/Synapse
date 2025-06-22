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

    const generatePromptForDiagramType = (type: string, hasQuestion: boolean, userInput: string, hasImage: boolean, hasAudio: boolean) => {
      const baseInstructions = `
      **CRITICAL FORMATTING REQUIREMENTS:**
      - You MUST return ONLY a JSON object - no other text, comments, explanations, or formatting
      - Do NOT use markdown code blocks (no \`\`\`json or \`\`\` tags)
      - Do NOT return Mermaid diagrams (\`\`\`mermaid, graph TD, graph LR, etc.)
      - Do NOT return any diagram syntax or pseudocode
      - Your entire response must be a single, valid JSON object that can be parsed directly
      
      **Content Requirements:**
      - Perform Sentiment Analysis: For every entity and relationship, determine sentiment as "positive", "negative", or "neutral"
      - Add Descriptions: Include a 'description' field for every entity and relationship
      - Use the exact JSON structure provided in the example
      `

      switch (type) {
        case 'flowchart':
          if (hasQuestion) {
            return `Create a flowchart that answers the user's question by showing a process, workflow, or decision tree.

            User's Question: "${userInput}"

            **ABSOLUTELY CRITICAL: Return ONLY raw JSON - no markdown, no code blocks, no Mermaid syntax, no explanations**

            **Instructions:**
            1. **Formulate Answer:** Create a clear, detailed textual answer to the user's question.
            2. **Build Process Flowchart:** Create a flowchart that shows the step-by-step process related to your answer.
            3. **Flowchart Rules:** 
               - ALWAYS start with ONE "Start" node (START_END type)
               - ALWAYS end with ONE "End" node (START_END type)
               - Use PROCESS nodes for actions, tasks, or steps in the process
               - Use DECISION nodes for yes/no questions or choices (must have exactly 2 outgoing edges: "Yes" and "No")
               - Use INPUT_OUTPUT nodes for gathering information or inputs
               - Use DISPLAY nodes for showing results, outputs, or final answers
               - Connect nodes in logical sequence - the flow should tell a clear story
               - Keep the flowchart simple and easy to follow
               - Each step should logically lead to the next
               - Avoid complex branching unless necessary
            4. **Entity Types:** Use START_END, PROCESS, DECISION, INPUT_OUTPUT, DISPLAY
            
            ${baseInstructions}`
          } else {
            // Enhanced code detection for multiple programming languages
            const looksLikeCode = userInput && (
              // JavaScript/TypeScript
              userInput.includes('function') || 
              userInput.includes('const ') ||
              userInput.includes('let ') ||
              userInput.includes('var ') ||
              userInput.includes('console.log') ||
              userInput.includes('=> {') ||
              userInput.includes('require(') ||
              userInput.includes('import ') ||
              userInput.includes('export ') ||
              userInput.includes('async ') ||
              userInput.includes('await ') ||
              
              // Python
              userInput.includes('def ') || 
              userInput.includes('print(') ||
              userInput.includes('if __name__') ||
              userInput.includes('import ') ||
              userInput.includes('from ') ||
              userInput.includes('class ') ||
              userInput.includes('elif ') ||
              userInput.includes('try:') ||
              userInput.includes('except:') ||
              userInput.includes('with ') ||
              userInput.includes('lambda ') ||
              
              // Java/C#
              userInput.includes('public static') ||
              userInput.includes('public class') ||
              userInput.includes('private ') ||
              userInput.includes('protected ') ||
              userInput.includes('System.out.println') ||
              userInput.includes('Console.WriteLine') ||
              userInput.includes('namespace ') ||
              userInput.includes('using ') ||
              
              // C/C++
              userInput.includes('#include') || 
              userInput.includes('int main') ||
              userInput.includes('printf(') ||
              userInput.includes('cout <<') ||
              userInput.includes('cin >>') ||
              userInput.includes('std::') ||
              userInput.includes('#define') ||
              userInput.includes('malloc(') ||
              userInput.includes('free(') ||
              
              // PHP
              userInput.includes('<?php') ||
              userInput.includes('echo ') ||
              userInput.includes('$_GET') ||
              userInput.includes('$_POST') ||
              userInput.includes('function ') ||
              
              // Ruby
              userInput.includes('puts ') ||
              userInput.includes('def ') ||
              userInput.includes('end') ||
              userInput.includes('require ') ||
              
              // Go
              userInput.includes('package main') ||
              userInput.includes('func main') ||
              userInput.includes('fmt.Print') ||
              userInput.includes('import (') ||
              
              // Rust
              userInput.includes('fn main') ||
              userInput.includes('println!') ||
              userInput.includes('use std::') ||
              userInput.includes('let mut') ||
              
              // SQL
              userInput.includes('SELECT ') ||
              userInput.includes('INSERT ') ||
              userInput.includes('UPDATE ') ||
              userInput.includes('DELETE ') ||
              userInput.includes('CREATE TABLE') ||
              userInput.includes('FROM ') ||
              userInput.includes('WHERE ') ||
              
              // General programming patterns
              userInput.includes('if (') || 
              userInput.includes('for (') || 
              userInput.includes('while (') || 
              userInput.includes('return ') ||
              userInput.includes('else {') ||
              userInput.includes('} else') ||
              userInput.includes('switch (') ||
              userInput.includes('case ') ||
              userInput.includes('break;') ||
              userInput.includes('continue;') ||
              (userInput.includes('{') && userInput.includes('}')) ||
              (userInput.includes('(') && userInput.includes(')') && userInput.includes(';')) ||
              
              // Common code patterns
              userInput.match(/\b(if|else|for|while|do|switch|case|break|continue|return|function|def|class|import|include)\b/) ||
              userInput.match(/[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*\)\s*\{/) || // Function definitions
              userInput.match(/[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^=]/) || // Variable assignments
              userInput.match(/\/\/|\/\*|\#|<!--/) || // Comments
              userInput.match(/[;{}]\s*$/) // Code-like line endings
            )

            if (looksLikeCode) {
              return `Create a DETAILED and COMPREHENSIVE flowchart from the provided code that shows every significant step in the program's execution flow.

              **Code to analyze:**
              ${userInput}

              **ABSOLUTELY CRITICAL: Return ONLY raw JSON - no markdown, no code blocks, no Mermaid syntax, no explanations**

              **Instructions:**
              1. **Deep Code Analysis:** Thoroughly analyze every line of code, understanding all logic paths, variables, functions, conditions, and operations.
              
              2. **Comprehensive Flowchart Mapping - BE DETAILED:**
                 - **Program Initialization:** Start with "Start Program" node
                 - **Import/Include Statements:** Create PROCESS nodes for each significant import or include
                 - **Variable Declarations:** Create separate PROCESS nodes for each variable declaration or initialization
                 - **Function Definitions:** Create SUBROUTINE nodes for each function/method definition
                 - **Main Program Entry:** Create clear entry point (e.g., "Enter Main Function" or "Begin Execution")
                 - **Input Operations:** Create INPUT_OUTPUT nodes for each input operation (input(), scanf(), prompt(), etc.)
                 - **Data Processing:** Break down complex operations into multiple PROCESS nodes
                 - **Calculations:** Create separate PROCESS nodes for each mathematical operation or calculation
                 - **String Operations:** Create PROCESS nodes for string manipulations, concatenations, etc.
                 - **Array/List Operations:** Create PROCESS nodes for array access, iteration setup, etc.
                 - **Conditional Logic:** 
                   * Create DECISION nodes for each if/else, switch case, ternary operator
                   * Include nested conditions as separate DECISION nodes
                   * Map each condition evaluation clearly
                 - **Loop Structures:** 
                   * Create PROCESS nodes for loop initialization
                   * Create DECISION nodes for loop conditions
                   * Create PROCESS nodes for loop body operations
                   * Create PROCESS nodes for loop increment/decrement
                   * Show loop flow clearly with proper connections
                 - **Function Calls:** Create SUBROUTINE nodes for each function call
                 - **Error Handling:** Create DECISION nodes for try/catch, error checks
                 - **Output Operations:** Create DISPLAY nodes for each print, console.log, cout, etc.
                 - **Return Statements:** Create PROCESS nodes for each return statement
                 - **Program Termination:** End with "End Program" node

              3. **Detailed Flow Requirements:**
                 - **Granular Steps:** Break down complex operations into 3-5 smaller steps
                 - **Variable Tracking:** Show when variables are created, modified, or used
                 - **Condition Details:** Make decision nodes specific (e.g., "Is x > 10?" not just "Check condition")
                 - **Loop Details:** Show initialization, condition check, body execution, and increment as separate steps
                 - **Function Flow:** Show parameter passing, execution, and return value handling
                 - **Data Flow:** Show how data moves through the program
                 - **Edge Cases:** Include error handling and boundary condition checks

              4. **Enhanced Entity Types and Usage:**
                 - **START_END:** "Start Program", "End Program", "Enter Function", "Exit Function"
                 - **PROCESS:** Variable assignments, calculations, data manipulations, initializations
                 - **DECISION:** All conditional checks, loop conditions, error checks, validation
                 - **INPUT_OUTPUT:** User input, file reading, parameter input
                 - **SUBROUTINE:** Function calls, method invocations, API calls
                 - **DISPLAY:** Output statements, printing, logging, file writing

              5. **Detailed Flowchart Rules:**
                 - Create 15-30 nodes minimum for comprehensive coverage
                 - ALWAYS start with ONE "Start Program" node (START_END type)
                 - ALWAYS end with ONE "End Program" node (START_END type)
                 - Every DECISION node must have exactly TWO outgoing edges: "Yes" and "No"
                 - Use descriptive, specific labels (e.g., "Initialize counter i = 0" not "Initialize variable")
                 - Show the logical sequence of execution
                 - Include error handling paths where applicable
                 - For loops, show: initialization → condition check → body execution → increment → condition check (loop)
                 - For functions, show: call → parameter passing → execution → return
                 - Connect nodes in the exact order they would execute
                 - Include intermediate steps for complex operations

              6. **Code Analysis Depth:**
                 - Identify all variables and their lifecycle
                 - Map all control structures (if/else, loops, switch)
                 - Identify all function calls and their purposes
                 - Understand data transformations
                 - Recognize input/output operations
                 - Identify error handling mechanisms
                 - Understand the program's overall purpose and flow

              ${baseInstructions}`
            } else {
              return `Create a flowchart from the provided input that shows a process, workflow, or step-by-step procedure.

              The user provided:
              ${userInput ? `Text: "${userInput}"` : ''}
              ${hasImage ? 'An image file or image URL.' : ''}
              ${hasAudio ? 'An audio/video file or audio URL.' : ''}

              **ABSOLUTELY CRITICAL: Return ONLY raw JSON - no markdown, no code blocks, no Mermaid syntax, no explanations**

              **Instructions:**
              1. **Extract Process:** Identify the main process, workflow, or procedure from the input.
              2. **Build Sequential Flowchart:** Create a clear, logical flow that shows step-by-step progression.
              3. **Flowchart Rules:** 
                 - ALWAYS start with ONE "Start" node (START_END type)
                 - ALWAYS end with ONE "End" node (START_END type)
                 - Use PROCESS nodes for actions, tasks, or steps
                 - Use DECISION nodes for yes/no questions or choices (must have exactly 2 outgoing edges)
                 - Use INPUT_OUTPUT nodes for gathering or providing information
                 - Use DISPLAY nodes for showing results or outputs
                 - Connect nodes in logical sequence - each step should flow naturally to the next
                 - For DECISION nodes, always use "Yes" and "No" as edge labels
                 - Make the process easy to follow from start to finish
                 - Avoid unnecessary complexity - keep it simple and clear
              4. **Entity Types:** Use START_END, PROCESS, DECISION, INPUT_OUTPUT, DISPLAY
              ${baseInstructions}`
            }
          }

        case 'mindmap':
          if (hasQuestion) {
            return `Create a comprehensive mind map that organizes information around the central topic of the user's question.

            User's Question: "${userInput}"

            **ABSOLUTELY CRITICAL: Return ONLY raw JSON - no markdown, no code blocks, no Mermaid syntax, no explanations**

            **Instructions:**
            1. **Formulate Answer:** First, create a clear, detailed textual answer to the user's question.
            2. **Build Mind Map:** Create a hierarchical structure with the main topic at the center and related concepts branching out.
            3. **Mind Map Structure:**
               - Central node: Main topic (level 0) - should be the core concept/theme
               - Primary branches: 3-6 major themes/categories (level 1) - key aspects of the topic
               - Secondary branches: 2-4 subtopics per primary branch (level 2) - specific details
               - Tertiary branches: 1-3 details per secondary branch (level 3) - examples, facts, specifics
               - Use 'level' property on nodes to indicate hierarchy depth (0=center, 1=main, 2=sub, 3=detail)
               - Connect related concepts with meaningful relationships
               - Aim for balanced branching - avoid having one branch with too many or too few connections
            4. **Entity Types:** Use TOPIC for central/main ideas (level 0-1), SUBTOPIC for branches (level 2), CONCEPT for details (level 3+)
            5. **Content Guidelines:**
               - Make branch labels concise but descriptive (2-4 words ideal)
               - Ensure logical flow from general to specific
               - Include diverse aspects of the topic for comprehensive coverage
               - Use parallel structure in branch naming when possible
            ${baseInstructions}`
          } else {
            return `Create a comprehensive mind map from the provided input, organizing information hierarchically around a central theme.

            The user provided:
            ${userInput ? `Text: "${userInput}"` : ''}
            ${hasImage ? 'An image file or image URL.' : ''}
            ${hasAudio ? 'An audio/video file or audio URL.' : ''}

            **ABSOLUTELY CRITICAL: Return ONLY raw JSON - no markdown, no code blocks, no Mermaid syntax, no explanations**

            **Instructions:**
            1. **Identify Central Theme:** Find the main topic or theme from the input - this becomes your central node.
            2. **Build Mind Map:** Create a hierarchical structure branching from the center.
            3. **Mind Map Structure:**
               - Central node: Main topic (level 0) - the core subject matter
               - Primary branches: 3-6 major themes/categories (level 1) - main aspects or components
               - Secondary branches: 2-4 subtopics per primary branch (level 2) - specific elements
               - Tertiary branches: 1-3 details per secondary branch (level 3) - examples, specifics, facts
               - Add 'level' property to indicate hierarchy (0=center, 1=main, 2=sub, 3=detail)
               - Create balanced branching structure
            4. **Entity Types:** Use TOPIC for central/main ideas (level 0-1), SUBTOPIC for branches (level 2), CONCEPT for details (level 3+)
            5. **Content Guidelines:**
               - Extract key themes and organize them logically
               - Use concise, descriptive labels (2-4 words)
               - Ensure comprehensive coverage of the input content
               - Maintain parallel structure where appropriate
            ${baseInstructions}`
          }

        default: // knowledge-graph
          if (hasQuestion) {
            return `Create a knowledge graph that answers the user's question by showing entities and their relationships.

            User's Question: "${userInput}"

            **Instructions:**
            1. **Formulate Answer:** First, create a clear, detailed textual answer to the user's question.
            2. **Build Knowledge Graph:** Identify all relevant entities and the relationships connecting them.
            3. **Be Comprehensive:** Include important related context for richer understanding.
            4. **Entity Types:** Use PERSON, ORG, LOCATION, DATE, EVENT, PRODUCT, CONCEPT, JOB_TITLE, FIELD_OF_STUDY, THEORY, ART_WORK
            ${baseInstructions}`
          } else {
            return `Build a comprehensive knowledge graph from the provided inputs, identifying entities and their relationships.

      The user provided:
            ${userInput ? `Text: "${userInput}"` : ''}
      ${hasImage ? 'An image file or image URL.' : ''}
            ${hasAudio ? 'An audio/video file or audio URL.' : ''}

      **Instructions:**
            1. **Be Exhaustive:** Find every possible entity and relationship.
            2. **Dense Connections:** Aim for a well-connected graph.
            3. **Entity Types:** Use PERSON, ORG, LOCATION, DATE, EVENT, PRODUCT, CONCEPT, JOB_TITLE, FIELD_OF_STUDY, THEORY, ART_WORK
            ${baseInstructions}`
          }
      }
    }

    // Generate appropriate prompt based on diagram type
    textPrompt = generatePromptForDiagramType(
      diagramType,
      !!question,
      question || textInput || '',
      hasImage,
      !!audioPart
    )

    const getExampleStructure = (diagramType: string, hasQuestion: boolean) => {
      const baseStructures: Record<string, any> = {
        'knowledge-graph': {
          question: {
            answer: "A detailed textual answer to the user's question goes here...",
            graph: {
              entities: [
                {"id": "e1", "label": "Example Entity", "type": "CONCEPT", "sentiment": "neutral", "description": "A brief summary or definition of the entity."}
              ],
              relationships: [
                {"source": "e1", "target": "e2", "label": "IS_RELATED_TO", "sentiment": "neutral", "description": "What connects the two nodes."}
              ]
            }
          },
          text: {
            graph: {
              entities: [
                {"id": "e1", "label": "Example Entity", "type": "CONCEPT", "sentiment": "neutral", "description": "A brief summary or definition of the entity."}
              ],
              relationships: [
                {"source": "e1", "target": "e2", "label": "IS_RELATED_TO", "sentiment": "neutral", "description": "What connects the two nodes."}
              ]
            }
          }
        },
        'flowchart': {
          question: {
            answer: "A detailed textual answer to the user's question goes here...",
            graph: {
              entities: [
                {"id": "start", "label": "Start", "type": "START_END", "sentiment": "neutral", "description": "Beginning of the process"},
                {"id": "step1", "label": "Gather Information", "type": "INPUT_OUTPUT", "sentiment": "neutral", "description": "Collect required information"},
                {"id": "step2", "label": "Analyze Data", "type": "PROCESS", "sentiment": "neutral", "description": "Process the information"},
                {"id": "decision1", "label": "Is Data Complete?", "type": "DECISION", "sentiment": "neutral", "description": "Check if all required data is available"},
                {"id": "step3", "label": "Generate Solution", "type": "PROCESS", "sentiment": "neutral", "description": "Create the solution or answer"},
                {"id": "display1", "label": "Present Result", "type": "DISPLAY", "sentiment": "neutral", "description": "Show the final result"},
                {"id": "end", "label": "End", "type": "START_END", "sentiment": "neutral", "description": "End of the process"}
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
                {"id": "start", "label": "Start Program", "type": "START_END", "sentiment": "neutral", "description": "Program execution begins"},
                {"id": "import1", "label": "Import Libraries", "type": "PROCESS", "sentiment": "neutral", "description": "Load required modules"},
                {"id": "init1", "label": "Initialize Variables", "type": "PROCESS", "sentiment": "neutral", "description": "Set up program variables"},
                {"id": "main_entry", "label": "Enter Main Function", "type": "PROCESS", "sentiment": "neutral", "description": "Begin main program logic"},
                {"id": "input1", "label": "Get User Input", "type": "INPUT_OUTPUT", "sentiment": "neutral", "description": "Receive data from user"},
                {"id": "validate", "label": "Is Input Valid?", "type": "DECISION", "sentiment": "neutral", "description": "Check input validity"},
                {"id": "error_msg", "label": "Display Error Message", "type": "DISPLAY", "sentiment": "neutral", "description": "Show error to user"},
                {"id": "process1", "label": "Process Input Data", "type": "PROCESS", "sentiment": "neutral", "description": "Transform input data"},
                {"id": "calc1", "label": "Perform Calculations", "type": "PROCESS", "sentiment": "neutral", "description": "Execute mathematical operations"},
                {"id": "loop_init", "label": "Initialize Loop Counter", "type": "PROCESS", "sentiment": "neutral", "description": "Set up iteration variable"},
                {"id": "loop_check", "label": "Counter < Limit?", "type": "DECISION", "sentiment": "neutral", "description": "Check loop condition"},
                {"id": "loop_body", "label": "Execute Loop Body", "type": "PROCESS", "sentiment": "neutral", "description": "Perform loop operations"},
                {"id": "loop_increment", "label": "Increment Counter", "type": "PROCESS", "sentiment": "neutral", "description": "Update loop variable"},
                {"id": "func_call", "label": "Call Helper Function", "type": "SUBROUTINE", "sentiment": "neutral", "description": "Execute external function"},
                {"id": "result_check", "label": "Result Available?", "type": "DECISION", "sentiment": "neutral", "description": "Check if processing succeeded"},
                {"id": "format_output", "label": "Format Results", "type": "PROCESS", "sentiment": "neutral", "description": "Prepare output data"},
                {"id": "display_result", "label": "Display Results", "type": "DISPLAY", "sentiment": "neutral", "description": "Show final output"},
                {"id": "cleanup", "label": "Cleanup Resources", "type": "PROCESS", "sentiment": "neutral", "description": "Free memory and resources"},
                {"id": "end", "label": "End Program", "type": "START_END", "sentiment": "neutral", "description": "Program execution ends"}
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
            answer: "A detailed textual answer to the user's question goes here...",
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