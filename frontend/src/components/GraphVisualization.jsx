import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useMemo } from 'react'
import { Network } from 'vis-network'
import { getNodeColor, getEdgeColor } from '../utils/colors'
import { useTheme } from '../contexts/ThemeContext'

const escapeXml = (unsafe) => {
  if (typeof unsafe !== 'string') {
    return unsafe
  }
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
    }
  })
}

const GraphVisualization = forwardRef(
  (
    { data, isLoading, setTooltip, setSelectedNode, setSelectedEdge, physicsOptions, styleOptions, onGraphReady, diagramType = 'knowledge-graph' },
    ref
  ) => {
    const containerRef = useRef(null)
    const networkInstance = useRef(null)
    const { theme } = useTheme()

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, node: null, edge: null })
    const [isInteracting, setIsInteracting] = useState(false)
    const [zoomLevel, setZoomLevel] = useState(1)
    const [networkStats, setNetworkStats] = useState({ nodes: 0, edges: 0 })

    // Use refs for callbacks to prevent re-triggering useEffect
    const onGraphReadyRef = useRef(onGraphReady)
    useEffect(() => {
      onGraphReadyRef.current = onGraphReady
    }, [onGraphReady])

    const dataRef = useRef(data)
    const normalizedDataRef = useRef(null)
    
    useEffect(() => {
      dataRef.current = data
    }, [data])

    // Normalize edge ids before using anywhere in the component - use useMemo to prevent unnecessary re-creation
    const normalizedData = useMemo(() => {
      if (!data || !data.edges) return data
      
      const normalizedEdges = (data.edges ?? []).map(edge => ({
        ...edge,
        id: edge.id || edge._id || edge.uuid || String(edge.source) + '-' + String(edge.target),
      }))
      
      console.log('Normalized edge ids:', normalizedEdges.map(e => e.id));
      console.log('Normalized edges:', normalizedEdges);
      
      return { ...data, edges: normalizedEdges }
    }, [data])
    
    // Update normalized data ref
    useEffect(() => {
      normalizedDataRef.current = normalizedData
    }, [normalizedData])

    // Enhanced context menu handler
    const handleContextMenu = (event, nodeId = null, edgeId = null) => {
      event.preventDefault()
      const rect = containerRef.current.getBoundingClientRect()
      setContextMenu({
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        node: nodeId ? (normalizedDataRef.current?.nodes ?? []).find(n => n.id === nodeId) : null,
        edge: edgeId ? (normalizedDataRef.current?.edges ?? []).find(e => e.id === edgeId) : null
      })
    }

    // Close context menu when clicking elsewhere
    useEffect(() => {
      const handleClickOutside = () => setContextMenu({ visible: false, x: 0, y: 0, node: null, edge: null })
      if (contextMenu.visible) {
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
      }
    }, [contextMenu.visible])

    // Function to set up all network event listeners with enhanced interactivity
    const setupNetworkEventListeners = (network) => {
      // Use a simple, direct click handler to avoid race conditions.
      network.on('click', (event) => {
        console.log('Click event:', event)
        console.log('Available nodes in normalizedDataRef:', normalizedDataRef.current?.nodes?.map(n => ({ id: n.id, label: n.label })))
        console.log('Available edges in normalizedDataRef:', normalizedDataRef.current?.edges?.map(e => ({ id: e.id, label: e.label })))
        
        if (event.nodes.length > 0) {
          const nodeId = event.nodes[0]
          console.log('Looking for node with ID:', nodeId)
          const node = (normalizedDataRef.current?.nodes ?? []).find((n) => n.id === nodeId)
          console.log('Found node:', node)
          if (node) {
            console.log('Setting selectedNode to:', node)
          setSelectedNode(node)
          setSelectedEdge(null)
          } else {
            console.log('Node not found in normalizedDataRef, checking original dataRef')
            const originalNode = (dataRef.current?.nodes ?? []).find((n) => n.id === nodeId)
            console.log('Found in original dataRef:', originalNode)
            if (originalNode) {
              setSelectedNode(originalNode)
              setSelectedEdge(null)
            }
          }
        } else if (event.edges.length > 0) {
          const edgeId = event.edges[0]
          console.log('Looking for edge with ID:', edgeId)
          const edge = (normalizedDataRef.current?.edges ?? []).find((e) => e.id === edgeId)
          console.log('Found edge:', edge)
          if (edge) {
            console.log('Setting selectedEdge to:', edge)
            setSelectedEdge(edge)
            setSelectedNode(null)
          } else {
            console.log('Edge not found in normalizedDataRef, checking original dataRef')
            const originalEdge = (dataRef.current?.edges ?? []).find((e) => e.id === edgeId)
            console.log('Found in original dataRef:', originalEdge)
            if (originalEdge) {
              setSelectedEdge(originalEdge)
            setSelectedNode(null)
            }
          }
        } else {
          console.log('Clearing selections')
          setSelectedNode(null)
          setSelectedEdge(null)
        }
      })

      // Enhanced hover effects with smooth transitions
      network.on('hoverNode', ({ node, event }) => {
        const nodeData = (normalizedDataRef.current?.nodes ?? []).find((n) => n.id === node)
        if (nodeData && event.pointer && event.pointer.DOM) {
          // Enhanced tooltip with more information
          const content = `
            <div class="tooltip-content">
              <div class="tooltip-title">${nodeData.label}</div>
              <div class="tooltip-type">${nodeData.type}</div>
              ${nodeData.description ? `<div class="tooltip-desc">${nodeData.description.substring(0, 100)}${nodeData.description.length > 100 ? '...' : ''}</div>` : ''}
              ${nodeData.sentiment ? `<div class="tooltip-sentiment">Sentiment: ${nodeData.sentiment}</div>` : ''}
            </div>
          `
          setTooltip({
            visible: true,
            content,
            x: event.pointer.DOM.x,
            y: event.pointer.DOM.y,
          })
        }
        
        // Change cursor to pointer
        containerRef.current.style.cursor = 'pointer'
      })

      network.on('hoverEdge', ({ edge, event }) => {
        const edgeData = (normalizedDataRef.current?.edges ?? []).find((e) => e.id === edge)
        if (edgeData && event.pointer && event.pointer.DOM) {
          const content = `
            <div class="tooltip-content">
              <div class="tooltip-title">${edgeData.label}</div>
              ${edgeData.description ? `<div class="tooltip-desc">${edgeData.description.substring(0, 100)}${edgeData.description.length > 100 ? '...' : ''}</div>` : ''}
              ${edgeData.sentiment ? `<div class="tooltip-sentiment">Sentiment: ${edgeData.sentiment}</div>` : ''}
            </div>
          `
          setTooltip({
            visible: true,
            content,
            x: event.pointer.DOM.x,
            y: event.pointer.DOM.y,
          })
        }
        
        containerRef.current.style.cursor = 'pointer'
      })

      network.on('blurNode', () => {
        setTooltip({ visible: false, content: '', x: 0, y: 0 })
        containerRef.current.style.cursor = 'default'
      })

      network.on('blurEdge', () => {
        setTooltip({ visible: false, content: '', x: 0, y: 0 })
        containerRef.current.style.cursor = 'default'
      })

      // Context menu support
      network.on('oncontext', (event) => {
        if (event.nodes.length > 0) {
          handleContextMenu(event.event, event.nodes[0])
        } else if (event.edges.length > 0) {
          handleContextMenu(event.event, null, event.edges[0])
        } else {
          handleContextMenu(event.event)
        }
      })

      // Interaction state tracking
      network.on('dragStart', () => {
        setIsInteracting(true)
        containerRef.current.style.cursor = 'grabbing'
      })

      network.on('dragEnd', () => {
        setIsInteracting(false)
        containerRef.current.style.cursor = 'default'
      })

      network.on('zoom', (params) => {
        setZoomLevel(params.scale)
      })

      // Enhanced stabilization with progress feedback
      network.on('stabilizationProgress', () => {
        // You could show progress here if needed
      })

      network.on('stabilized', () => {
        console.log('Network stabilized, performing robust fit...')
        
        const performStabilizedFit = () => {
          try {
            // Force a redraw first
            if (network && network.redraw) {
              network.redraw()
            } else {
              console.warn('Network or redraw method not available in stabilized event')
              onGraphReadyRef.current(true)
              return
            }
            
            // Get current state
            const preScale = network.getScale()
            const prePosition = network.getViewPosition()
            console.log('Stabilized pre-fit state:', { scale: preScale, position: prePosition })
            
            // Force fit without animation
            network.fit({ animation: false })
            
            // Check if fit worked
            setTimeout(() => {
              if (network) {
                const postScale = network.getScale()
                const postPosition = network.getViewPosition()
                console.log('Stabilized post-fit state:', { scale: postScale, position: postPosition })
                
                // If scale is reasonable, do final animated fit
                if (postScale >= 0.1 && postScale <= 5.0) {
                  network.fit({
                    animation: {
                      duration: 1200,
                      easingFunction: 'easeInOutQuint'
                    }
                  })
                } else {
                  console.warn('Stabilized fit resulted in invalid scale, using manual positioning')
                  network.moveTo({
                    position: { x: 0, y: 0 },
                    scale: 1.0,
                    animation: {
                      duration: 1000,
                      easingFunction: 'easeInOutQuint'
                    }
                  })
                }
              }
            }, 100)
            
          } catch (error) {
            console.warn('Error in stabilized fit:', error)
          }
          onGraphReadyRef.current(true)
        }
        
        performStabilizedFit()
      })

      // Touch support for mobile devices
      let touchStartTime = 0
      
              containerRef.current?.addEventListener('touchstart', () => {
          touchStartTime = Date.now()
        }, { passive: true })

      containerRef.current?.addEventListener('touchend', (e) => {
        const touchEndTime = Date.now()
        const touchDuration = touchEndTime - touchStartTime
        
        if (touchDuration < 500) { // Quick tap
          const touch = e.changedTouches[0]
          const rect = containerRef.current.getBoundingClientRect()
          const x = touch.clientX - rect.left
          const y = touch.clientY - rect.top
          
          // Simulate click at touch position
          const clickEvent = {
            pointer: { DOM: { x: touch.clientX, y: touch.clientY } },
            nodes: [],
            edges: []
          }
          
          // Find nodes/edges at touch position (simplified)
          const nodeAtPosition = network.getNodeAt({ x, y })
          const edgeAtPosition = network.getEdgeAt({ x, y })
          
          if (nodeAtPosition) {
            clickEvent.nodes = [nodeAtPosition]
          } else if (edgeAtPosition) {
            clickEvent.edges = [edgeAtPosition]
          }
          
          network.emit('click', clickEvent)
        }
      }, { passive: true })
    }

    // Get layout options based on diagram type
    const getLayoutOptions = (type) => {
      switch (type) {
        case 'flowchart':
          return {
            hierarchical: {
              enabled: true,
              levelSeparation: styleOptions.flowchartSpacing?.levelSeparation || 120, // Reduced for tighter vertical flow
              nodeSpacing: 150, // Increased spacing between nodes
              treeSpacing: 150, // Reduced for more compact layout
              blockShifting: true,
              edgeMinimization: false, // Disable to prevent odd node placements
              parentCentralization: false, // Disable to keep root at top
              direction: 'UD', // Up-Down for clear process flow
              sortMethod: 'directed',
              shakeTowards: 'leaves',
              levelDistribution: {
                min: 1,
                max: 1
              }
            },
          }
        case 'mindmap':
          return {
            hierarchical: {
              enabled: true,
              levelSeparation: styleOptions.mindmapSpacing?.levelSeparation || 250,
              nodeSpacing: styleOptions.mindmapSpacing?.nodeSpacing || 120,
              treeSpacing: 150, // Improved tree spacing for better organization
              blockShifting: true,
              edgeMinimization: true,
              parentCentralization: true,
              direction: 'LR', // Left-Right for mind map style
              sortMethod: 'directed',
              shakeTowards: 'leaves',
            },
          }
        default: // knowledge-graph
          return {
            improvedLayout: true,
            randomSeed: 2, // For consistent but dynamic layouts
          }
      }
    }

    // Get physics options based on diagram type
    const getPhysicsOptions = (type) => {
      switch (type) {
        case 'flowchart':
          return {
            enabled: true,
            hierarchicalRepulsion: {
              centralGravity: 0.0,
              springLength: 100,  // Shorter springs for tighter layout
              springConstant: 0.02,  // Stronger springs
              nodeDistance: 120,
              damping: 0.2,  // Increased damping for less oscillation
            },
            minVelocity: 0.3,  // Lower velocity for smoother settling
            solver: 'hierarchicalRepulsion',
            stabilization: {
              enabled: true,
              iterations: 1000,
              updateInterval: 25,
              onlyDynamicEdges: false,
              fit: true,
            },
            timestep: 0.35,  // Smaller timestep for smoother animation
            adaptiveTimestep: true,
            hierarchical: {
              direction: 'UD',  // Force top-to-bottom direction
              levelSeparation: 120,
              nodeSpacing: 100,
              treeSpacing: 150,
              blockShifting: true,
              edgeMinimization: false,
              parentCentralization: false,
            },
          };
        case 'mindmap':
          return {
            enabled: true,
            hierarchicalRepulsion: {
              centralGravity: 0.0,
              springLength: 200,
              springConstant: 0.01,
              nodeDistance: 150,
              damping: 0.09,
            },
            minVelocity: 0.75,
            solver: 'hierarchicalRepulsion',
            stabilization: {
              enabled: true,
              iterations: 1000,
              updateInterval: 25,
              onlyDynamicEdges: false,
              fit: true,
            },
            timestep: 0.5,
            adaptiveTimestep: true,
          };
        default: // knowledge-graph
          return {
            enabled: true,
            solver: 'barnesHut',
            barnesHut: {
              ...physicsOptions,
              centralGravity: 0.3,
              springLength: 350,
              springConstant: 0.04,
              damping: 0.3,
              avoidOverlap: 0.1,
            },
            stabilization: {
              enabled: true,
              iterations: 1000,
              updateInterval: 50,
              fit: true,
            },
          };
      }
    }

    // Get node size based on diagram type and node properties
    const getNodeSize = (node, diagramType) => {
      if (diagramType === 'mindmap') {
        // Enhanced mind map sizes - more appealing hierarchy
        if (node.level === 0) return 65 // Central topic - prominent and commanding
        if (node.level === 1) return 45 // Main branches - substantial
        if (node.level === 2) return 35 // Secondary branches - medium
        if (node.level === 3) return 28 // Tertiary branches - balanced
        if (node.level === 4) return 22 // Fourth level - compact
        return 18 // Deeper levels - minimal but readable
      }
      
      if (diagramType === 'flowchart') {
        // Standard flowchart sizes based on node type
        switch (node.type) {
          case 'START_END': return { width: 150, height: 60 }  // Oval shape
          case 'PROCESS': return { width: 160, height: 70 }    // Rectangle
          case 'DECISION': return { width: 100, height: 100 }  // Diamond (width and height should be equal)
          case 'INPUT_OUTPUT': return { width: 160, height: 70, shape: 'box', shapeProperties: { borderRadius: 10 } } // Parallelogram
          case 'CONNECTOR': return { width: 30, height: 30 }   // Circle
          case 'DOCUMENT': return { width: 140, height: 80, shape: 'box', shapeProperties: { borderRadius: [10, 10, 0, 0] } } // Document shape
          case 'DELAY': return { width: 140, height: 70, shape: 'box', shapeProperties: { borderRadius: [0, 0, 0, 0] } } // Delay shape
          case 'MERGE': return { width: 100, height: 100 }     // Diamond for merge
          case 'SUBROUTINE': return { width: 160, height: 70, shape: 'box', shapeProperties: { borderDashes: [5, 5] } } // Double border
          case 'MANUAL_LOOP': return { width: 160, height: 70 } // Regular rectangle
          case 'DATABASE': return { width: 120, height: 70 }    // Cylinder shape
          case 'DISPLAY': return { width: 160, height: 70, shape: 'box', shapeProperties: { borderRadius: 10 } } // Rounded rectangle
          default: return { width: 160, height: 70 }            // Default rectangle
        }
      }

      // Knowledge graph - keep as is (varied but larger for better visibility)
      if (node.type === 'PERSON') return 40
      if (node.type === 'ORG') return 38
      if (node.type === 'LOCATION') return 35
      return 32
    }

    // Get node shape based on diagram type and node properties
    const getNodeShape = (node, diagramType) => {
      // If node has a specific shape defined, use it
      if (node.shape) {
        return node.shape;
      }

      // For flowcharts, use type-based shapes
      if (diagramType === 'flowchart') {
        const shapeMap = {
          'START_END': 'ellipse',
          'PROCESS': 'box',
          'DECISION': 'diamond',
          'INPUT_OUTPUT': 'box',
          'CONNECTOR': 'circle',
          'DOCUMENT': 'box',
          'DELAY': 'box',
          'MERGE': 'triangle',
          'SUBROUTINE': 'box',
          'MANUAL_LOOP': 'box',
          'DATABASE': 'database',
          'DISPLAY': 'box'
        };
        return shapeMap[node.type] || 'box';
      }

      // For mindmaps, always use box
      if (diagramType === 'mindmap') {
        return 'box';
      }

      // For knowledge graph, default to circle but allow override via node.type
      if (diagramType === 'knowledge-graph' || !diagramType) {
        const knowledgeGraphShapes = {
          'PERSON': 'ellipse',
          'ORG': 'box',
          'LOCATION': 'diamond',
          'EVENT': 'star',
          'CONCEPT': 'circle',
          'OBJECT': 'box'
        };
        return knowledgeGraphShapes[node.type] || 'circle';
      }

      // Default to box for other diagram types
      return 'box';
    };

    // Get node colors based on diagram type
    const getNodeColors = (node, diagramType, theme) => {
      const highlightColor = '#8b5cf6'
      
      if (diagramType === 'mindmap') {
        // Enhanced mind map colors - vibrant and appealing hierarchy
        const level = node.level || 0
        const baseColors = {
          0: theme === 'dark' ? '#8b5cf6' : '#7c3aed', // Central topic - vibrant purple
          1: theme === 'dark' ? '#3b82f6' : '#2563eb', // Level 1 - bright blue
          2: theme === 'dark' ? '#10b981' : '#059669', // Level 2 - emerald green
          3: theme === 'dark' ? '#f59e0b' : '#d97706', // Level 3 - warm amber
          4: theme === 'dark' ? '#ef4444' : '#dc2626', // Level 4 - coral red
          5: theme === 'dark' ? '#ec4899' : '#db2777', // Level 5+ - pink
        }
        
        const color = baseColors[level] || baseColors[5]
        const borderColor = theme === 'dark' ? '#ffffff20' : '#00000020'
        
        return {
          border: borderColor,
          background: color,
          highlight: {
            border: '#ffffff',
            background: color,
          },
          hover: {
            border: '#ffffff80',
            background: color,
          },
        }
      }
      
      if (diagramType === 'flowchart') {
        // Standard flowchart colors based on node type
        const flowchartColors = {
          'START_END': theme === 'dark' ? '#10b981' : '#059669',    // Green for start/end
          'PROCESS': theme === 'dark' ? '#3b82f6' : '#2563eb',      // Blue for process
          'DECISION': theme === 'dark' ? '#f59e0b' : '#d97706',     // Yellow for decision
          'INPUT_OUTPUT': theme === 'dark' ? '#8b5cf6' : '#7c3aed', // Purple for input/output
          'CONNECTOR': theme === 'dark' ? '#6b7280' : '#4b5563',    // Gray for connector
          'DOCUMENT': theme === 'dark' ? '#ec4899' : '#db2777',     // Pink for document
          'DELAY': theme === 'dark' ? '#f97316' : '#ea580c',        // Orange for delay
          'MERGE': theme === 'dark' ? '#06b6d4' : '#0891b2',        // Cyan for merge
          'SUBROUTINE': theme === 'dark' ? '#10b981' : '#059669',   // Green for subroutine
          'MANUAL_LOOP': theme === 'dark' ? '#a855f7' : '#9333ea',  // Purple for manual loop
          'DATABASE': theme === 'dark' ? '#6366f1' : '#4f46e5',     // Indigo for database
          'DISPLAY': theme === 'dark' ? '#0ea5e9' : '#0284c7',      // Sky blue for display
        }
        
        const color = flowchartColors[node.type] || flowchartColors['PROCESS']
        const borderColor = theme === 'dark' ? '#374151' : '#d1d5db'
        
        return {
          border: borderColor,
          background: color,
          highlight: {
            border: '#ffffff',
            background: color,
          },
          hover: {
            border: '#ffffff',
            background: color,
          },
        }
      }

      // Knowledge graph colors - keep as is (more vibrant and varied)
      const color = getNodeColor(node.type, theme)
      return {
        border: theme === 'dark' ? '#374151' : '#d1d5db',
        background: color,
        highlight: {
          border: highlightColor,
          background: color,
        },
        hover: {
          border: highlightColor,
          background: color,
        },
      }
    }

    // Get font styling based on diagram type
    const getNodeFont = (node, diagramType, theme) => {
      if (diagramType === 'mindmap') {
        // Enhanced mind map fonts - appealing and readable hierarchy
        const fontSizes = {
          0: 20, // Central topic - prominent and commanding
          1: 16, // Level 1 - clear and substantial
          2: 14, // Level 2 - standard readable size
          3: 12, // Level 3 - compact but clear
          4: 11, // Level 4 - small but readable
          5: 10, // Level 5+ - minimal but legible
        }
        const fontSize = fontSizes[node.level] || fontSizes[5]
        const textColor = '#ffffff' // White text for all levels for better contrast
        
        return {
          size: fontSize,
          color: textColor,
          face: 'Inter, system-ui, sans-serif',
          strokeWidth: node.level === 0 ? 1 : 0, // Subtle stroke for central topic
          strokeColor: node.level === 0 ? '#00000040' : 'transparent',
          multi: false, // Single line for clean look
          bold: node.level === 0 ? 'bold' : node.level === 1 ? '600' : 'normal', // Bold hierarchy
        }
      }
      
      if (diagramType === 'flowchart') {
        // Minimalistic flowchart fonts - clean and functional
        const textColor = theme === 'dark' ? '#f8fafc' : '#ffffff'
        
        return {
          size: 14,
          color: textColor,
          face: 'Inter, system-ui, sans-serif',
          strokeWidth: 0, // No stroke for clean look
          strokeColor: 'transparent',
          multi: false, // Single line for simplicity
          bold: 'normal', // No bold for minimalism
        }
      }

      // Knowledge graph font - keep as is (more decorative)
      return {
        size: 13,
        face: 'Inter, sans-serif',
        color: theme === 'light' ? '#1f2937' : '#f9fafb',
        strokeWidth: 1,
        strokeColor: theme === 'light' ? '#ffffff' : '#000000',
      }
    }

    // Get edge styling based on diagram type
    const getEdgeStyle = (edge, diagramType) => {
      if (diagramType === 'flowchart') {
        // Minimalistic flowchart edges - clean and simple
        const color = theme === 'dark' ? '#64748b' : '#475569' // Simple gray for all edges
        
        return {
          color: color,
          width: 2, // Thinner lines for minimalism
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 1.0, // Smaller arrows
              type: 'arrow',
            },
          },
          smooth: {
            enabled: false, // Straight lines for clean look
            type: 'continuous',
          },
          font: {
            size: 12, // Smaller font
            color: color,
            strokeWidth: 0, // No stroke for clean text
            strokeColor: 'transparent',
            align: 'middle',
          },
          shadow: false, // No shadows for minimalism
        }
      }
      
      if (diagramType === 'mindmap') {
        // Enhanced mind map edges - elegant and appealing
        const baseColor = theme === 'dark' ? '#6366f1' : '#4f46e5' // Indigo color for elegance
        
        return {
          color: {
            color: baseColor,
            opacity: 0.7, // Slightly more visible
          },
          width: 2, // Slightly thicker for better visibility
          arrows: {
            to: {
              enabled: false, // No arrows for clean mind map
            },
          },
          smooth: {
            enabled: true,
            type: 'curvedCW', // Elegant curves
            roundness: 0.3, // More pronounced curvature for appeal
          },
          font: {
            size: 0, // Hide all edge labels for clean look
            color: 'transparent',
          },
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.1)',
            size: 3,
            x: 1,
            y: 1,
          },
          selectionWidth: 3, // Better selection highlight
        }
      }

      // Knowledge graph edges - keep as is (dynamic and varied)
      return {
        color: getEdgeColor(edge.sentiment),
        width: 2,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.8,
            type: 'arrow',
          },
        },
        smooth: {
          enabled: true,
          type: 'dynamic',
          roundness: 0.5,
        },
        font: {
          size: 12,
          color: theme === 'light' ? '#475569' : '#94a3b8',
          strokeWidth: 2,
          strokeColor: theme === 'light' ? '#f1f5f9' : '#0f172a',
          align: 'middle',
        },
      }
    }

    // Initialize network
    useEffect(() => {
      if (containerRef.current) {
        // Ensure container has proper dimensions
        const container = containerRef.current
        console.log('Container dimensions:', {
          width: container.offsetWidth,
          height: container.offsetHeight,
          clientWidth: container.clientWidth,
          clientHeight: container.clientHeight
        })
        
        const options = getOptions()
        // Initialize with empty data to prevent undefined errors
        const emptyData = { nodes: [], edges: [] }
        const network = new Network(container, emptyData, options)
        networkInstance.current = network

        // Set up all event listeners
        setupNetworkEventListeners(network)

        // Add resize observer to handle container size changes
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            console.log('Container resized:', entry.contentRect)
            if (network && network.redraw && network.fit && networkInstance.current) {
              // Trigger redraw and fit when container size changes
              setTimeout(() => {
                if (networkInstance.current && networkInstance.current.redraw && networkInstance.current.fit) {
                  networkInstance.current.redraw()
                  networkInstance.current.fit({ animation: { duration: 500 } })
                }
              }, 100)
            }
          }
        })
        resizeObserver.observe(container)

        return () => {
          resizeObserver.disconnect()
          if (networkInstance.current) {
            networkInstance.current.destroy()
            networkInstance.current = null
          }
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Run only once

    const getOptions = () => ({
      autoResize: true,
      height: '100%',
      width: '100%',

      nodes: {
        size: 25,
        borderWidth: diagramType === 'mindmap' ? 1 : diagramType === 'flowchart' ? 1 : 2, // Minimal borders for mind maps and flowcharts
        borderWidthSelected: diagramType === 'mindmap' ? 2 : diagramType === 'flowchart' ? 2 : 4, // Subtle selection for minimalistic diagrams
        font: {
          size: 14,
          face: 'Inter',
          color: '#ffffff',
        },
        shadow: diagramType === 'knowledge-graph' ? true : false, // Only shadows for knowledge graphs
        shapeProperties: {
          borderDashes: false, // Solid borders for all
          borderRadius: diagramType === 'mindmap' ? 8 : diagramType === 'flowchart' ? 4 : 6, // Minimal rounded corners
          interpolation: true,
          useImageSize: false,
          useBorderWithImage: true,
        },
      },
      edges: {
        width: diagramType === 'flowchart' ? 2 : diagramType === 'mindmap' ? 1 : 2, // Thinner edges for minimalistic styles
        font: {
          size: diagramType === 'flowchart' ? 12 : diagramType === 'mindmap' ? 0 : 12, // Hide mind map edge labels
          color: theme === 'light' ? '#475569' : '#94a3b8',
          strokeWidth: diagramType === 'flowchart' || diagramType === 'mindmap' ? 0 : 2, // No stroke for minimalistic
          strokeColor: diagramType === 'flowchart' || diagramType === 'mindmap' ? 'transparent' : (theme === 'light' ? '#f1f5f9' : '#0f172a'),
          align: 'middle',
        },
        arrows: {
          to: {
            enabled: diagramType !== 'mindmap', // No arrows for mind maps
            scaleFactor: diagramType === 'flowchart' ? 1.0 : 0.8, // Smaller arrows for minimalistic
            type: 'arrow',
          },
        },
        smooth: {
          enabled: diagramType !== 'flowchart', // Straight lines for flowcharts
          type: diagramType === 'mindmap' ? 'curvedCW' : 'dynamic',
          roundness: diagramType === 'mindmap' ? 0.1 : 0.5, // Minimal curvature for mind maps
      },
        shadow: diagramType === 'knowledge-graph' ? true : false, // Only shadows for knowledge graphs
        selectionWidth: diagramType === 'flowchart' || diagramType === 'mindmap' ? 2 : 3, // Minimal selection width
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        selectConnectedEdges: diagramType === 'knowledge-graph', // Only for knowledge graphs
        multiselect: diagramType === 'knowledge-graph', // Only for knowledge graphs
        zoomView: true,
        dragView: true,
      },
      physics: getPhysicsOptions(diagramType),
      layout: getLayoutOptions(diagramType),
      configure: {
        enabled: false,
      },
    })

    // Update options when theme, physics, or diagram type changes
    useEffect(() => {
      if (networkInstance.current) {
        console.log(`GraphVisualization: Updating options for ${diagramType}`)
        const options = getOptions()
        console.log('New options:', { 
          physics: options.physics, 
          layout: options.layout,
          diagramType 
        })
        networkInstance.current.setOptions(options)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme, physicsOptions, styleOptions, diagramType])

    // Update data
    useEffect(() => {
      // Defensive: Only proceed if networkInstance, data, and DOM container are ready
      if (!networkInstance.current) return;
      if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) return;
      if (!networkInstance.current.body || !networkInstance.current.body.container) return;

      console.log(`GraphVisualization: Processing ${diagramType} with ${data.nodes.length} nodes and ${data.edges.length} edges`)
      
      // For mind maps, log the level information to debug structure issues
      if (diagramType === 'mindmap') {
        console.log('Mind map node levels:', data.nodes.map(n => ({ id: n.id, label: n.label, level: n.level })))
      }

      // Update network stats
      setNetworkStats({
        nodes: data.nodes.length,
        edges: data.edges.length
      })

      // Force a complete reset of the network view state
      try {
        networkInstance.current.moveTo({
          position: { x: 0, y: 0 },
          scale: 1.0,
          animation: false
        })
      } catch (resetError) {
        console.warn('Error resetting view position:', resetError)
      }

      onGraphReadyRef.current(false)

      let nodesWithStyling = (normalizedData?.nodes ?? []).map((node) => {
        const baseNode = {
        ...node,
        shape: getNodeShape(node, diagramType),
        size: getNodeSize(node, diagramType),
        color: getNodeColors(node, diagramType, theme),
        font: getNodeFont(node, diagramType, theme),
          // Enhanced node properties for better interactivity
          chosen: {
            node: (values, id, selected, hovering) => {
              if (hovering) {
                values.size *= 1.1
                values.borderWidth = 3
              }
              if (selected) {
                values.size *= 1.2
                values.borderWidth = 4
              }
            }
          }
        }

        // For mind maps, ensure level is properly set or inferred
        if (diagramType === 'mindmap') {
          let nodeLevel = node.level
          if (nodeLevel === undefined || nodeLevel === null) {
              if (node.type === 'TOPIC' && (node.label?.toLowerCase().includes('central') || node.id === 'center')) {
                nodeLevel = 0 // Central topic
              } else if (node.type === 'TOPIC') {
                nodeLevel = 1 // Main branch
              } else if (node.type === 'SUBTOPIC') {
                nodeLevel = 2 // Secondary branch
              } else if (node.type === 'CONCEPT') {
                nodeLevel = 3 // Detail level
              } else {
                nodeLevel = 1 // Default to main branch
            }
          }
          baseNode.level = nodeLevel
        } else if (diagramType === 'flowchart') {
          // For flowcharts, only assign level if it is present in the node data
          if (node.level !== undefined && node.level !== null) {
            baseNode.level = node.level;
          } else {
            delete baseNode.level;
          }
        } else {
          // For knowledge graphs, ensure NO nodes have level property to avoid conflicts
          delete baseNode.level
        }

        return baseNode
      })

      const visEdges = (normalizedData?.edges ?? []).map((edge) => {
        const edgeStyle = getEdgeStyle(edge, diagramType)
        const baseEdge = {
        ...edge,
        id: edge.id, // now always present
        from: edge.source,
        to: edge.target,
        label: edge.label,
          ...edgeStyle,
          // Enhanced edge properties for better interactivity
          chosen: {
            edge: (values, id, selected, hovering) => {
              if (hovering) {
                values.width *= 1.5
              }
              if (selected) {
                values.width *= 2
                values.color = '#8b5cf6'
              }
            }
          }
        }

        // For flowcharts, override label with condition if present
        if (diagramType === 'flowchart' && edge.condition) {
          baseEdge.label = edge.condition.toUpperCase()
        }

        // For mind maps, hide edge labels to keep it clean
        if (diagramType === 'mindmap') {
          baseEdge.label = undefined
        }

        return baseEdge
      })

      // Force container refresh before setting data
      try {
        const container = containerRef.current
        if (container) {
          // Force the network to recognize the container size
          networkInstance.current.setSize(container.offsetWidth, container.offsetHeight)
          console.log('Forced container size update:', {
            width: container.offsetWidth,
            height: container.offsetHeight
          })
        }
      } catch (sizeError) {
        console.warn('Error setting container size:', sizeError)
      }

      networkInstance.current.setData({ nodes: nodesWithStyling, edges: visEdges })

      // For static layouts, a simple fit after a delay is more reliable.
      if (diagramType === 'flowchart' || diagramType === 'mindmap') {
        const initialDelay = diagramType === 'flowchart' ? 500 : 700; // Longer delay for mindmap
        setTimeout(() => {
          if (networkInstance.current) {
            console.log(`Performing simple fit for ${diagramType}...`)
            networkInstance.current.fit({
              animation: {
                duration: 1200,
                easingFunction: 'easeInOutQuint'
              }
            })
            onGraphReadyRef.current(true)
          }
        }, initialDelay)
      } else {
        // Use the robust, physics-based fitting for knowledge graphs
        const performFit = (attempt = 1, maxAttempts = 8) => {
          if (!networkInstance.current) {
            console.warn('Network instance not available for fitting')
            onGraphReadyRef.current(true)
            return
          }

          try {
            console.log(`Fit attempt ${attempt} for ${diagramType}`)
            
            // Force complete redraw first
            if (networkInstance.current && networkInstance.current.redraw && networkInstance.current.body && networkInstance.current.body.container) {
              networkInstance.current.redraw()
            } else {
              console.warn('Network instance or redraw method not available')
              onGraphReadyRef.current(true)
              return
            }
            
            // Get viewport dimensions
            const container = containerRef.current
            if (container) {
              console.log('Container dimensions at fit time:', {
                offsetWidth: container.offsetWidth,
                offsetHeight: container.offsetHeight,
                clientWidth: container.clientWidth,
                clientHeight: container.clientHeight
              })
            }
            
            // Get current scale and position
            const preScale = networkInstance.current.getScale()
            const prePosition = networkInstance.current.getViewPosition()
            console.log(`Pre-fit state (attempt ${attempt}):`, { scale: preScale, position: prePosition })
            
            // Force immediate fit without animation
            networkInstance.current.fit({
              animation: false
            })
            
            // Check if fit actually worked
            setTimeout(() => {
              if (!networkInstance.current) return
              
              const postScale = networkInstance.current.getScale()
              const postPosition = networkInstance.current.getViewPosition()
              console.log(`Post-fit state (attempt ${attempt}):`, { scale: postScale, position: postPosition })
              
              // Check if the scale is reasonable (not too small)
              const minAcceptableScale = 0.1
              const maxAcceptableScale = 5.0
              
              if (postScale < minAcceptableScale || postScale > maxAcceptableScale || 
                  Math.abs(postPosition.x) > 10000 || Math.abs(postPosition.y) > 10000) {
                console.warn(`Fit attempt ${attempt} resulted in invalid scale/position, retrying...`)
                
                if (attempt < maxAttempts) {
                  // Try with different approaches
                  if (attempt <= 3) {
                    // First few attempts: standard fit
                    setTimeout(() => performFit(attempt + 1, maxAttempts), 200)
                  } else if (attempt <= 6) {
                    // Middle attempts: manual zoom and center
                    try {
                      networkInstance.current.moveTo({
                        position: { x: 0, y: 0 },
                        scale: 1.0,
                        animation: false
                      })
                      setTimeout(() => {
                        if (networkInstance.current) {
                          networkInstance.current.fit({ animation: false })
                        }
                      }, 100)
                      setTimeout(() => performFit(attempt + 1, maxAttempts), 300)
                    } catch (moveError) {
                      console.warn('Manual move failed:', moveError)
                      setTimeout(() => performFit(attempt + 1, maxAttempts), 200)
                    }
                  } else {
                    // Final attempts: force specific scale
                    try {
                      networkInstance.current.moveTo({
                        position: { x: 0, y: 0 },
                        scale: 0.8,
                        animation: false
                      })
                      setTimeout(() => performFit(attempt + 1, maxAttempts), 200)
                    } catch (forceError) {
                      console.warn('Force scale failed:', forceError)
                      onGraphReadyRef.current(true)
                    }
                  }
                } else {
                  console.error(`All ${maxAttempts} fit attempts failed, trying nuclear option...`)
                  
                  // Nuclear option: completely recreate the network
                  try {
                    const container = containerRef.current
                    if (container && networkInstance.current) {
                      console.log('Attempting network recreation...')
                      
                      // Destroy current network
                      networkInstance.current.destroy()
                      
                      // Create new network with same data and options
                      const options = getOptions()
                      const newNetwork = new Network(container, { nodes: nodesWithStyling, edges: visEdges }, options)
                      networkInstance.current = newNetwork
                      
                      // Add event listeners back
                      setupNetworkEventListeners(newNetwork)
                      
                      // Try fitting the new network
                      setTimeout(() => {
                        if (newNetwork) {
                          newNetwork.fit({
                            animation: {
                              duration: 1200,
                              easingFunction: 'easeInOutQuint'
                            }
                          })
                        }
                      }, 500)
                    }
                  } catch (nuclearError) {
                    console.error('Nuclear option failed:', nuclearError)
                  }
                  
                  onGraphReadyRef.current(true)
                }
              } else {
                console.log(`Fit successful on attempt ${attempt}!`)
                
                // Do a final animated fit for smooth visual effect
                networkInstance.current.fit({
                  animation: {
                    duration: 800,
                    easingFunction: 'easeInOutQuint'
                  }
                })
                
                onGraphReadyRef.current(true)
              }
            }, 150)
            
          } catch (error) {
            console.error(`Error in fit attempt ${attempt}:`, error)
            if (attempt < maxAttempts) {
              setTimeout(() => performFit(attempt + 1, maxAttempts), 300)
            } else {
              onGraphReadyRef.current(true)
            }
          }
        }

        performFit()
      }
    }, [data, theme, styleOptions, diagramType])

    // Helper to trigger file download
    const triggerDownload = (blob, fileName) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    // Enhanced SVG export utility with professional styling
    const downloadSVG = () => {
      if (!networkInstance.current) return;
      const network = networkInstance.current;
      
      // Get node and edge positions from vis-network
      const positions = network.getPositions();
      const nodes = normalizedData?.nodes ?? [];
      const edges = normalizedData?.edges ?? [];
      
      if (nodes.length === 0) {
        alert('No graph data to export.');
        return;
      }
      
      // Compute bounding box of all node positions with better padding
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach((node) => {
        const pos = positions[node.id];
        if (!pos) return;
        const size = getNodeSize(node, diagramType);
        if (pos.x - size < minX) minX = pos.x - size;
        if (pos.y - size < minY) minY = pos.y - size;
        if (pos.x + size > maxX) maxX = pos.x + size;
        if (pos.y + size > maxY) maxY = pos.y + size;
      });
      
      // Add generous padding for professional look
      const padding = 100;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      // Fallback if no nodes
      if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
        minX = 0; minY = 0; maxX = 1200; maxY = 800;
      }
      
      const width = maxX - minX;
      const height = maxY - minY;
      
      // Professional color scheme
      const isDark = theme === 'dark';
      const bgColor = isDark ? '#0f172a' : '#ffffff';
      const textColor = isDark ? '#f8fafc' : '#1e293b';
      const edgeColor = isDark ? '#64748b' : '#475569';
      
      // SVG header with professional styling
      let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}" style="background:${bgColor}; font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif;">\n`;
      
      // Enhanced styles with gradients and shadows
      svg += `<defs>\n`;
      
      // Gradients for nodes
      svg += `<linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
      </linearGradient>\n`;
      
      svg += `<linearGradient id="processGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
      </linearGradient>\n`;
      
      svg += `<linearGradient id="decisionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
      </linearGradient>\n`;
      
      svg += `<linearGradient id="startEndGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
      </linearGradient>\n`;
      
      // Drop shadow filter
      svg += `<filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="${isDark ? '#000000' : '#000000'}" flood-opacity="${isDark ? '0.4' : '0.15'}"/>
      </filter>\n`;
      
      // Arrowhead markers with better styling
      svg += `<marker id="arrowhead" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto" markerUnits="strokeWidth">
        <path d="M2,2 L2,10 L10,6 Z" fill="${edgeColor}" stroke="${edgeColor}" stroke-width="1"/>
      </marker>\n`;
      
      svg += `</defs>\n`;
      
      // Enhanced styles
      svg += `<style>\n`;
      svg += `.node-label { 
        font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif; 
        font-size: 14px; 
        font-weight: 600; 
        fill: ${textColor}; 
        text-anchor: middle; 
        dominant-baseline: central;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
      }\n`;
      svg += `.edge-label { 
        font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif; 
        font-size: 11px; 
        font-weight: 500; 
        fill: ${edgeColor}; 
        text-anchor: middle; 
        dominant-baseline: central;
      }\n`;
      svg += `.node-shape { 
        stroke: ${isDark ? '#475569' : '#e2e8f0'}; 
        stroke-width: 2; 
        filter: url(#dropShadow);
      }\n`;
      svg += `.edge-line { 
        stroke: ${edgeColor}; 
        stroke-width: 2; 
        fill: none;
        marker-end: url(#arrowhead);
      }\n`;
      svg += `</style>\n`;
      
      // Add background with subtle pattern
      svg += `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${bgColor}"/>\n`;
      
      // Draw edges with improved styling
      edges.forEach((edge) => {
        const from = positions[edge.source];
        const to = positions[edge.target];
        if (!from || !to) return;
        
        // Calculate control points for curved edges (except for flowcharts)
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (diagramType === 'flowchart') {
          // Straight lines for flowcharts
          svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="edge-line" />\n`;
        } else {
          // Curved lines for knowledge graphs and mind maps
          const curvature = Math.min(distance * 0.2, 50);
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const perpX = -dy / distance * curvature;
          const perpY = dx / distance * curvature;
          const ctrlX = midX + perpX;
          const ctrlY = midY + perpY;
          
          svg += `<path d="M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}" class="edge-line" />\n`;
        }
        
        // Enhanced edge labels
        let labelText = edge.label;
        if (diagramType === 'flowchart' && edge.condition) {
          labelText = edge.condition.toUpperCase();
        }
        
        if (labelText && labelText.trim()) {
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2;
          
          // Add background rectangle for better readability
          const textWidth = labelText.length * 7;
          svg += `<rect x="${mx - textWidth/2 - 4}" y="${my - 8}" width="${textWidth + 8}" height="16" 
                    fill="${bgColor}" fill-opacity="0.9" rx="3" stroke="${edgeColor}" stroke-width="1" stroke-opacity="0.3"/>\n`;
          svg += `<text x="${mx}" y="${my}" class="edge-label">${escapeXml(labelText)}</text>\n`;
        }
      });
      
      // Draw nodes with enhanced styling
      nodes.forEach((node) => {
        const pos = positions[node.id];
        if (!pos) return;
        
        const size = getNodeSize(node, diagramType);
        const shape = getNodeShape(node, diagramType);
        
        // Choose gradient based on node type
        let fillGradient = 'url(#nodeGradient)';
        if (diagramType === 'flowchart') {
          switch (node.type) {
            case 'START_END': fillGradient = 'url(#startEndGradient)'; break;
            case 'PROCESS': fillGradient = 'url(#processGradient)'; break;
            case 'DECISION': fillGradient = 'url(#decisionGradient)'; break;
            default: fillGradient = 'url(#processGradient)'; break;
          }
        } else if (diagramType === 'mindmap') {
          const level = node.level || 0;
          const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
          const color = colors[level % colors.length];
          fillGradient = color;
        }
        
        // Draw shapes based on type
        if (shape === 'diamond') {
          const points = `${pos.x},${pos.y-size} ${pos.x+size},${pos.y} ${pos.x},${pos.y+size} ${pos.x-size},${pos.y}`;
          svg += `<polygon points="${points}" fill="${fillGradient}" class="node-shape" />\n`;
        } else if (shape === 'box') {
          if (node.type === 'INPUT_OUTPUT') {
            // Parallelogram for input/output
            const offset = size * 0.3;
            const points = `${pos.x-size+offset},${pos.y-size/2} ${pos.x+size+offset},${pos.y-size/2} ${pos.x+size-offset},${pos.y+size/2} ${pos.x-size-offset},${pos.y+size/2}`;
            svg += `<polygon points="${points}" fill="${fillGradient}" class="node-shape" />\n`;
          } else {
            // Regular rectangle
            svg += `<rect x="${pos.x-size}" y="${pos.y-size/2}" width="${size*2}" height="${size}" 
                      rx="6" ry="6" fill="${fillGradient}" class="node-shape" />\n`;
          }
        } else if (shape === 'circle' || shape === 'ellipse') {
          const rx = shape === 'ellipse' ? size : size;
          const ry = shape === 'ellipse' ? size/2 : size;
          svg += `<ellipse cx="${pos.x}" cy="${pos.y}" rx="${rx}" ry="${ry}" fill="${fillGradient}" class="node-shape" />\n`;
        } else {
          // Default circle
          svg += `<circle cx="${pos.x}" cy="${pos.y}" r="${size}" fill="${fillGradient}" class="node-shape" />\n`;
        }
        
        // Enhanced node labels with better positioning
        const label = node.label || 'Node';
        const maxLabelLength = 20;
        const truncatedLabel = label.length > maxLabelLength ? label.substring(0, maxLabelLength) + '...' : label;
        
        svg += `<text x="${pos.x}" y="${pos.y}" class="node-label">${escapeXml(truncatedLabel)}</text>\n`;
        
        // Add type indicator for flowcharts
        if (diagramType === 'flowchart' && node.type) {
          svg += `<text x="${pos.x}" y="${pos.y + size + 15}" 
                    style="font-size: 9px; font-weight: 400; fill: ${edgeColor}; text-anchor: middle;">${node.type}</text>\n`;
        }
      });
      
      // Add watermark
      svg += `<text x="${maxX - 10}" y="${maxY - 10}" 
                style="font-size: 10px; font-weight: 400; fill: ${edgeColor}; text-anchor: end; opacity: 0.6;">
                Generated by Synapse
              </text>\n`;
      
      svg += `</svg>`;
      
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const fileName = `synapse-${diagramType}-${new Date().toISOString().split('T')[0]}.svg`;
      triggerDownload(blob, fileName);
    }

    useImperativeHandle(ref, () => ({
      networkInstance,
      downloadSVG,
      downloadJSON: () => {
        const jsonString = JSON.stringify(data, null, 2);
        const fileName = `synapse-${diagramType}.json`;
        const blob = new Blob([jsonString], { type: 'application/json' });
        triggerDownload(blob, fileName);
      },
      downloadNodesCSV: () => {
        const headers = ['id', 'label', 'type', 'sentiment'];
        let csvContent = headers.join(',') + '\r\n';
        // Defensive: ensure normalizedData.nodes is an array
        const nodes = Array.isArray(normalizedData?.nodes) ? normalizedData.nodes : [];
        nodes.forEach((node) => {
          const row = headers.map((header) => `"${(node && node[header] !== undefined && node[header] !== null) ? String(node[header]).replace(/"/g, '""') : ''}"`);
          csvContent += row.join(',') + '\r\n';
        });
        if (nodes.length === 0) {
          alert('No node data to export.');
          return;
        }
        const fileName = `synapse-${diagramType}-nodes.csv`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, fileName);
      },
      downloadEdgesCSV: () => {
        const headers = ['source', 'target', 'label', 'sentiment'];
        let csvContent = headers.join(',') + '\r\n';
        // Defensive: ensure normalizedData.edges is an array
        const edges = Array.isArray(normalizedData?.edges) ? normalizedData.edges : [];
        edges.forEach((edge) => {
          const row = headers.map((header) => `"${(edge && edge[header] !== undefined && edge[header] !== null) ? String(edge[header]).replace(/"/g, '""') : ''}"`);
          csvContent += row.join(',') + '\r\n';
        });
        if (edges.length === 0) {
          alert('No edge data to export.');
          return;
        }
        const fileName = `synapse-${diagramType}-edges.csv`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, fileName);
      },
      fitToViewport: () => {
        if (networkInstance.current && networkInstance.current.redraw && networkInstance.current.fit && networkInstance.current.body && networkInstance.current.body.container) {
          try {
            // Force redraw first
            networkInstance.current.redraw()
            
            // Then fit to viewport
            networkInstance.current.fit({
              animation: {
                duration: 1000,
                easingFunction: 'easeInOutQuad'
              }
            })
          } catch (error) {
            console.warn('Error fitting network to viewport:', error)
          }
        } else {
          console.warn('Network instance not properly initialized for fitToViewport')
        }
      },
      forceRedraw: () => {
        if (networkInstance.current && networkInstance.current.redraw && networkInstance.current.fit && networkInstance.current.body && networkInstance.current.body.container) {
          try {
            networkInstance.current.redraw()
            networkInstance.current.fit({
              animation: { duration: 500 }
            })
          } catch (error) {
            console.warn('Error forcing redraw:', error)
          }
        } else {
          console.warn('Network instance not properly initialized for forceRedraw')
        }
      },
    }))

    return (
      <div className="h-full w-full relative" style={{ minHeight: '400px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-skin-bg/80 backdrop-blur-sm z-20">
            <div className="bg-skin-bg-accent/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-skin-border">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 border-4 border-skin-accent/30 border-t-skin-accent rounded-full animate-spin"></div>
                <div className="text-skin-text text-lg font-semibold">
              Generating {diagramType === 'knowledge-graph' ? 'Graph' : diagramType === 'flowchart' ? 'Flowchart' : 'Mind Map'}...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Network Stats Display */}
        {networkStats.nodes > 0 && (
          <div className="absolute top-4 left-4 z-10 bg-skin-bg-accent/80 backdrop-blur-md rounded-lg px-3 py-2 border border-skin-border shadow-lg">
            <div className="flex items-center gap-3 text-sm text-skin-text-muted">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {networkStats.nodes} nodes
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {networkStats.edges} edges
              </span>
              {zoomLevel !== 1 && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  {Math.round(zoomLevel * 100)}%
                </span>
              )}
            </div>
          </div>
        )}

        {/* Interaction Indicator */}
        {isInteracting && (
          <div className="absolute top-4 right-4 z-10 bg-skin-accent/90 backdrop-blur-md rounded-lg px-3 py-2 border border-skin-accent/30 shadow-lg animate-pulse">
            <div className="flex items-center gap-2 text-sm text-white">
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              Interacting
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu.visible && (
          <div 
            className="absolute z-50 bg-skin-bg-accent/95 backdrop-blur-md rounded-lg shadow-2xl border border-skin-border py-2 min-w-48 animate-fade-in"
            style={{ 
              left: `${contextMenu.x}px`, 
              top: `${contextMenu.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {contextMenu.node && (
              <>
                <div className="px-4 py-2 border-b border-skin-border">
                  <div className="font-semibold text-skin-text text-sm">{contextMenu.node.label}</div>
                  <div className="text-xs text-skin-text-muted">{contextMenu.node.type}</div>
                </div>
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-skin-text hover:bg-skin-border transition-colors"
                  onClick={() => {
                    setSelectedNode(contextMenu.node)
                    setContextMenu({ visible: false, x: 0, y: 0, node: null, edge: null })
                  }}
                >
                  View Details
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-skin-text hover:bg-skin-border transition-colors"
                  onClick={() => {
                    if (networkInstance.current && networkInstance.current.fit) {
                      networkInstance.current.fit({
                        nodes: [contextMenu.node.id],
                        animation: { duration: 800, easingFunction: 'easeInOutQuad' }
                      })
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, node: null, edge: null })
                  }}
                >
                  Focus on Node
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-skin-text hover:bg-skin-border transition-colors"
                  onClick={() => {
                    if (networkInstance.current && networkInstance.current.getConnectedNodes && networkInstance.current.selectNodes && networkInstance.current.unselectAll) {
                      const connectedNodes = networkInstance.current.getConnectedNodes(contextMenu.node.id)
                      networkInstance.current.selectNodes([contextMenu.node.id, ...connectedNodes])
                      setTimeout(() => {
                        if (networkInstance.current && networkInstance.current.unselectAll) {
                          networkInstance.current.unselectAll()
                        }
                      }, 3000)
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, node: null, edge: null })
                  }}
                >
                  Highlight Connections
                </button>
              </>
            )}
            
            {contextMenu.edge && (
              <>
                <div className="px-4 py-2 border-b border-skin-border">
                  <div className="font-semibold text-skin-text text-sm">{contextMenu.edge.label}</div>
                  <div className="text-xs text-skin-text-muted">Connection</div>
                </div>
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-skin-text hover:bg-skin-border transition-colors"
                  onClick={() => {
                    setSelectedEdge(contextMenu.edge)
                    setContextMenu({ visible: false, x: 0, y: 0, node: null, edge: null })
                  }}
                >
                  View Details
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-skin-text hover:bg-skin-border transition-colors"
                  onClick={() => {
                    if (networkInstance.current && networkInstance.current.fit) {
                      const nodes = [contextMenu.edge.source, contextMenu.edge.target]
                      networkInstance.current.fit({
                        nodes: nodes,
                        animation: { duration: 800, easingFunction: 'easeInOutQuad' }
                      })
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, node: null, edge: null })
                  }}
                >
                  Focus on Connection
                </button>
              </>
            )}
            
            {!contextMenu.node && !contextMenu.edge && (
              <>
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-skin-text hover:bg-skin-border transition-colors"
                  onClick={() => {
                    if (networkInstance.current && networkInstance.current.fit) {
                      networkInstance.current.fit({
                        animation: { duration: 1000, easingFunction: 'easeInOutQuad' }
                      })
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, node: null, edge: null })
                  }}
                >
                  Fit to View
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-skin-text hover:bg-skin-border transition-colors"
                  onClick={() => {
                    if (networkInstance.current && networkInstance.current.moveTo) {
                      networkInstance.current.moveTo({
                        position: { x: 0, y: 0 },
                        scale: 1.0,
                        animation: { duration: 800, easingFunction: 'easeInOutQuad' }
                      })
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, node: null, edge: null })
                  }}
                >
                  Reset View
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-skin-text hover:bg-skin-border transition-colors"
                  onClick={() => {
                    if (networkInstance.current && networkInstance.current.selectAll && networkInstance.current.unselectAll) {
                      networkInstance.current.selectAll()
                      setTimeout(() => {
                        if (networkInstance.current && networkInstance.current.unselectAll) {
                          networkInstance.current.unselectAll()
                        }
                      }, 2000)
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, node: null, edge: null })
                  }}
                >
                  Select All
                </button>
              </>
            )}
          </div>
        )}

        <div 
          ref={containerRef} 
          className="h-full w-full" 
          style={{ 
            minHeight: '400px',
            width: '100%',
            height: '100%',
          }} 
        />
      </div>
    )
  }
)

export default GraphVisualization