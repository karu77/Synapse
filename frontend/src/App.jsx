import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import GraphVisualization from './components/GraphVisualization'
import {
  generateGraph,
  getHistory,
  deleteHistoryItem,
  clearAllHistory,
} from './services/api'
import ThemeToggleButton from './components/ThemeToggleButton'
import ControlSidebar from './components/ControlSidebar'
import NodeInfoPanel from './components/NodeInfoPanel'
import EdgeInfoPanel from './components/EdgeInfoPanel'
import AnswerPanel from './components/AnswerPanel'
import WelcomeScreen from './components/WelcomeScreen'
import {
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  DocumentArrowDownIcon,
  Bars3Icon,
  CodeBracketIcon,
  TableCellsIcon,
  ArrowDownOnSquareIcon,
  MagnifyingGlassIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from './contexts/AuthContext'
import { Menu } from '@headlessui/react'
import { Fragment } from 'react'
import Tooltip from './components/Tooltip'

const defaultPhysicsOptions = {
  gravitationalConstant: -40000,
  springLength: 300,
  springConstant: 0.04,
  damping: 0.3,
  avoidOverlap: 0.8,
}

const defaultStyleOptions = {
  edgeStyle: 'continuous',
  nodeShapes: {
    PERSON: 'sphere',
    ORG: 'box',
    LOCATION: 'diamond',
    DATE: 'triangle',
    EVENT: 'star',
    PRODUCT: 'ellipse',
    CONCEPT: 'dot',
    JOB_TITLE: 'box',
    FIELD_OF_STUDY: 'circle',
    THEORY: 'square',
    ART_WORK: 'star',
  },
  mindmapColors: {
    0: '#8b5cf6', // Central topic - vibrant purple
    1: '#3b82f6', // Level 1 - bright blue
    2: '#10b981', // Level 2 - emerald green
    3: '#f59e0b', // Level 3 - warm amber
    4: '#ef4444', // Level 4 - coral red
    5: '#ec4899', // Level 5+ - pink
  },
  mindmapSpacing: {
    nodeSpacing: 140,
    levelSeparation: 280,
  },
  flowchartColors: {
    'START_END': '#059669',    // Emerald green - clean and professional
    'PROCESS': '#3b82f6',      // Bright blue - trustworthy and clear
    'DECISION': '#f59e0b',     // Amber orange - attention-grabbing but not harsh
    'INPUT_OUTPUT': '#8b5cf6', // Purple - distinctive for data flow
    'CONNECTOR': '#64748b',    // Slate gray - neutral connector
    'DOCUMENT': '#ec4899',     // Pink - stands out for documentation
    'DELAY': '#f97316',        // Orange - indicates waiting/delay
    'MERGE': '#06b6d4',        // Cyan - fresh color for merge points
    'SUBROUTINE': '#10b981',   // Emerald - consistent with start/end family
    'MANUAL_LOOP': '#a855f7',  // Violet - manual operations
    'DATABASE': '#6366f1',     // Indigo - data storage
    'DISPLAY': '#0ea5e9',      // Sky blue - output display
  },
  flowchartSpacing: {
    nodeSpacing: 150,
    levelSeparation: 200,
  },
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] })
  const [isProcessing, setIsProcessing] = useState(false)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' })
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentDiagramType, setCurrentDiagramType] = useState('knowledge-graph')
  const [flowchartDirection, setFlowchartDirection] = useState('TB')
  const [physicsOptions, setPhysicsOptions] = useState(defaultPhysicsOptions)
  const [styleOptions, setStyleOptions] = useState(defaultStyleOptions)
  const [isGraphReady, setIsGraphReady] = useState(false)
  const [graphKey, setGraphKey] = useState(0)
  const [history, setHistory] = useState([])
  const [shortcuts, setShortcuts] = useState({ visible: false })
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [contextMenu, setContextMenu] = useState({ visible: false })
  const graphRef = useRef(null)
  const containerRef = useRef(null)
  const onGraphReadyRef = useRef(null)
  const { user: authUser, logout } = useAuth()

  // Add context menu handlers
  const handleNodeContextMenu = useCallback((node, position) => {
    return (
      <div className="flex flex-col gap-2">
        <button
          className="text-left px-3 py-1.5 hover:bg-skin-border rounded-md transition-colors"
          onClick={() => {
            setSelectedNode(node);
            setContextMenu({ visible: false });
          }}
        >
          View Details
        </button>
        <button
          className="text-left px-3 py-1.5 hover:bg-skin-border rounded-md transition-colors"
          onClick={() => {
            if (graphRef.current) {
              graphRef.current.focus(node.id, {
                scale: 1.5,
                animation: true
              });
            }
            setContextMenu({ visible: false });
          }}
        >
          Focus Node
        </button>
      </div>
    );
  }, []);

  const handleEdgeContextMenu = useCallback((edge, position) => {
    return (
      <div className="flex flex-col gap-2">
        <button
          className="text-left px-3 py-1.5 hover:bg-skin-border rounded-md transition-colors"
          onClick={() => {
            setSelectedEdge(edge);
            setContextMenu({ visible: false });
          }}
        >
          View Relationship
        </button>
      </div>
    );
  }, []);

  const handleBackgroundContextMenu = useCallback((position) => {
    return (
      <div className="flex flex-col gap-2">
        <button
          className="text-left px-3 py-1.5 hover:bg-skin-border rounded-md transition-colors"
          onClick={() => {
            if (graphRef.current) {
              graphRef.current.fit({
                animation: {
                  duration: 1000,
                  easingFunction: 'easeInOutQuad'
                }
              });
            }
            setContextMenu({ visible: false });
          }}
        >
          Fit to View
        </button>
      </div>
    );
  }, []);

  // Debug logging for selection state
  useEffect(() => {
    console.log('Selected node changed:', selectedNode)
  }, [selectedNode])

  useEffect(() => {
    console.log('Selected edge changed:', selectedEdge)
  }, [selectedEdge])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts if not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault();
            toggleSidebar();
            break;
          case '/':
            e.preventDefault();
            setIsSearching(true);
            break;
          case 'f':
            e.preventDefault();
            if (graphRef.current) {
              graphRef.current.fit({
                animation: {
                  duration: 1000,
                  easingFunction: 'easeInOutQuad'
                }
              });
            }
            break;
          default:
            break;
        }
      } else if (e.key === 'Escape') {
        setIsSearching(false);
        setShortcuts({ visible: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle search
  const handleSearch = (query) => {
    if (!query.trim()) return;
    
    // Find matching nodes
    const nodes = graphData.nodes || [];
    const matchingNodes = nodes.filter(node => {
      const searchableText = `${node.label} ${node.type} ${node.description || ''}`.toLowerCase();
      return searchableText.includes(query.toLowerCase());
    });

    // Highlight matching nodes
    if (matchingNodes.length > 0) {
      const network = graphRef.current;
      if (network) {
        network.selectNodes(matchingNodes.map(node => node.id));
        network.focus(matchingNodes[0].id, {
          scale: 1.2,
          animation: {
            duration: 1000,
            easingFunction: 'easeInOutQuad'
          }
        });
      }
    }
  };

  const fetchHistory = useCallback(async () => {
    if (authUser) {
    try {
        const historyData = await getHistory()
        setHistory(historyData.reverse())
    } catch (error) {
      console.error('Failed to fetch history:', error)
      }
    }
  }, [authUser])

  // Load history from backend on initial render
  useEffect(() => {
    if (authUser) {
      fetchHistory()
    }
  }, [authUser, fetchHistory])

  const handleTextSubmit = async (text, question, imageFile, audioFile, imageUrl, audioUrl, diagramType) => {
    setIsProcessing(true)
    setSelectedNode(null)
    setSelectedEdge(null)
    setAnswer('')
    setIsSidebarOpen(false)
    
    setCurrentDiagramType(diagramType)
    try {
      const { answer, graphData } = await generateGraph(
        '', // Always leave text blank
        text || question, // Always send the user's input as the question
        imageFile,
        audioFile,
        imageUrl,
        audioUrl,
        diagramType
      )
      console.log('Received graphData from backend:', graphData)
      setAnswer(answer)
      setGraphData({
        nodes: Array.isArray(graphData?.nodes) ? graphData.nodes : [],
        edges: Array.isArray(graphData?.edges) ? graphData.edges : [],
        diagramType: diagramType
      })
      console.log('Set graphData in state:', {
        nodes: Array.isArray(graphData?.nodes) ? graphData.nodes : [],
        edges: Array.isArray(graphData?.edges) ? graphData.edges : [],
        diagramType: diagramType
      })
      setGraphKey((prevKey) => prevKey + 1)
      await fetchHistory()
    } catch (error) {
      console.error('Submission error:', error)
      alert(error.message || 'An unexpected error occurred.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Download handlers with useCallback for performance
  const handleDownloadSVG = useCallback(() => {
    console.log('Download SVG clicked, graphRef.current:', graphRef.current)
    console.log('Available methods:', graphRef.current ? Object.keys(graphRef.current) : 'No ref')
    if (graphRef.current && graphRef.current.downloadSVG) {
      graphRef.current.downloadSVG()
    } else {
      console.error('downloadSVG method not available')
    }
  }, [])
  const handleDownloadJSON = useCallback(() => {
    console.log('Download JSON clicked, graphRef.current:', graphRef.current)
    console.log('Available methods:', graphRef.current ? Object.keys(graphRef.current) : 'No ref')
    if (graphRef.current && graphRef.current.downloadJSON) {
      graphRef.current.downloadJSON()
    } else {
      console.error('downloadJSON method not available')
    }
  }, [])
  const handleDownloadNodesCSV = useCallback(() => {
    console.log('Download Nodes CSV clicked, graphRef.current:', graphRef.current)
    console.log('Available methods:', graphRef.current ? Object.keys(graphRef.current) : 'No ref')
    if (graphRef.current && graphRef.current.downloadNodesCSV) {
      graphRef.current.downloadNodesCSV()
    } else {
      console.error('downloadNodesCSV method not available')
    }
  }, [])
  const handleDownloadEdgesCSV = useCallback(() => {
    console.log('Download Edges CSV clicked, graphRef.current:', graphRef.current)
    console.log('Available methods:', graphRef.current ? Object.keys(graphRef.current) : 'No ref')
    if (graphRef.current && graphRef.current.downloadEdgesCSV) {
      graphRef.current.downloadEdgesCSV()
    } else {
      console.error('downloadEdgesCSV method not available')
    }
  }, [])
  
  const handleFitToViewport = useCallback(() => {
    console.log('Fit to viewport clicked, graphRef.current:', graphRef.current)
    console.log('Available methods:', graphRef.current ? Object.keys(graphRef.current) : 'No ref')
    if (graphRef.current && graphRef.current.fitToViewport) {
      graphRef.current.fitToViewport()
    } else {
      console.error('fitToViewport method not available')
    }
  }, [])
  
  const handleForceRedraw = useCallback(() => {
    console.log('Force redraw clicked, graphRef.current:', graphRef.current)
    console.log('Available methods:', graphRef.current ? Object.keys(graphRef.current) : 'No ref')
    if (graphRef.current && graphRef.current.forceRedraw) {
      graphRef.current.forceRedraw()
    } else {
      console.error('forceRedraw method not available')
    }
  }, [])

  const loadFromHistory = (historyItem) => {
    console.log('Loading from history:', historyItem)
    setSelectedNode(null)
    setSelectedEdge(null)
    
    // Ensure the diagram type is set before the graph data
    const diagramType = historyItem.graphData.diagramType || historyItem.inputs.diagramType || 'knowledge-graph'
    setCurrentDiagramType(diagramType)
    
    // For hierarchical diagrams (mind maps and flowcharts), ensure all nodes have proper level properties
    let graphData = historyItem.graphData
    if ((diagramType === 'mindmap' || diagramType === 'flowchart') && graphData.nodes) {
      graphData = {
        ...graphData,
        nodes: graphData.nodes.map(node => {
          let nodeLevel = node.level
          
          // If level is missing, try to infer it based on diagram type and node properties
          if (nodeLevel === undefined || nodeLevel === null) {
            if (diagramType === 'mindmap') {
              // Infer mind map levels based on node type and properties
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
            } else if (diagramType === 'flowchart') {
              // Infer flowchart levels based on node type
              if (node.type === 'START_END' && (node.label?.toLowerCase().includes('start') || node.id?.includes('start'))) {
                nodeLevel = 0 // Start node
              } else if (node.type === 'START_END' && (node.label?.toLowerCase().includes('end') || node.id?.includes('end'))) {
                nodeLevel = 10 // End node (high level to place at bottom)
              } else if (node.type === 'DECISION') {
                nodeLevel = 3 // Decision nodes in middle
              } else if (node.type === 'PROCESS') {
                nodeLevel = 2 // Process nodes
              } else {
                nodeLevel = 1 // Default level
              }
            }
          }
          
          return {
            ...node,
            level: nodeLevel
          }
        }),
        diagramType: diagramType // Ensure diagram type is preserved
      }
    } else if (diagramType === 'knowledge-graph' && graphData.nodes) {
      // For knowledge graphs, remove level properties to avoid conflicts
      graphData = {
        ...graphData,
        nodes: graphData.nodes.map(node => {
          const { level: _level, ...nodeWithoutLevel } = node
          return nodeWithoutLevel
        }),
        diagramType: diagramType
      }
    }
    
    setGraphData(graphData)
    setAnswer(historyItem.inputs.answer || '')
    setGraphKey((prevKey) => prevKey + 1)
    setIsSidebarOpen(false)
  }

  const handleDeleteFromHistory = async (id) => {
    try {
      await deleteHistoryItem(id)
      await fetchHistory()
    } catch (error) {
      console.error('Failed to delete history item:', error)
    }
  }

  const handleClearHistory = async () => {
    try {
      await clearAllHistory()
      setHistory([])
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  const resetPhysics = () => {
    setPhysicsOptions(defaultPhysicsOptions)
  }

  const resetStyles = () => {
    setStyleOptions({ ...defaultStyleOptions })
  }

  const toggleSidebar = () => {
    console.log('toggleSidebar called, current state:', isSidebarOpen)
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleDiagramTypeChange = (diagramType) => {
    console.log('Diagram type changed to:', diagramType)
    
    // Clear existing graph data immediately when diagram type changes
    setGraphData({ nodes: [], edges: [] })
    setSelectedNode(null)
    setSelectedEdge(null)
    setAnswer('')
    
    setCurrentDiagramType(diagramType)
  }

  // Responsive breakpoints
  const isMobile = windowSize.width < 768

  return (
    <div className="h-screen w-screen overflow-hidden bg-skin-bg text-skin-text font-sans flex flex-col">
      <Tooltip {...tooltip} />

      {/* Keyboard Shortcuts Help */}
      {shortcuts.visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShortcuts({ visible: false })}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-skin-bg-accent rounded-2xl p-6 max-w-md w-full border border-skin-border shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-skin-text">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-skin-text-muted">Open Controls</span>
                <kbd className="px-2 py-1 bg-skin-border rounded text-xs">Ctrl+K</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-skin-text-muted">Fit to View</span>
                <kbd className="px-2 py-1 bg-skin-border rounded text-xs">Ctrl+F</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-skin-text-muted">Download SVG</span>
                <kbd className="px-2 py-1 bg-skin-border rounded text-xs">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-skin-text-muted">Download JSON</span>
                <kbd className="px-2 py-1 bg-skin-border rounded text-xs">Ctrl+J</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-skin-text-muted">Search</span>
                <kbd className="px-2 py-1 bg-skin-border rounded text-xs">Ctrl+/</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-skin-text-muted">Close/Escape</span>
                <kbd className="px-2 py-1 bg-skin-border rounded text-xs">Esc</kbd>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Search Modal */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[50] bg-black/30 backdrop-blur-sm flex items-start justify-center pt-20"
          onClick={() => setIsSearching(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            className="bg-skin-bg-accent rounded-2xl p-4 max-w-lg w-full mx-4 border border-skin-border shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-skin-text-muted" />
              <input
                type="text"
                placeholder="Search nodes, types, or descriptions..."
                className="flex-1 bg-transparent text-skin-text placeholder-skin-text-muted outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery)
                    setIsSearching(false)
                  }
                }}
                autoFocus
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {isSidebarOpen && (
            <ControlSidebar
              isOpen={isSidebarOpen}
              onClose={toggleSidebar}
              onSubmit={handleTextSubmit}
              isProcessing={isProcessing}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              history={history}
              loadFromHistory={loadFromHistory}
              onDelete={handleDeleteFromHistory}
              onClear={handleClearHistory}
              styleOptions={styleOptions}
              setStyleOptions={setStyleOptions}
              resetStyles={resetStyles}
              physicsOptions={physicsOptions}
              setPhysicsOptions={setPhysicsOptions}
              resetPhysics={resetPhysics}
              user={authUser}
              logout={logout}
              currentDiagramType={currentDiagramType}
              onDiagramTypeChange={handleDiagramTypeChange}
              alwaysShowMediaInputs={true}
            />
        )}
      </AnimatePresence>

      {/* Move AI Answer panel to the left, vertically centered, and always visible */}
      {answer && (
        <div className={`fixed top-1/2 transform -translate-y-1/2 z-40 max-w-xs w-full sm:w-96 animate-fade-in-panel transition-all duration-300 ${
          isSidebarOpen ? 'left-[28rem]' : 'left-4'
        }`}>
          <AnswerPanel answer={answer} onClose={() => setAnswer('')} />
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 z-30 p-4 pointer-events-none">
        <div
          className={`max-w-screen-2xl mx-auto flex justify-between items-center bg-skin-bg-accent/80 backdrop-blur-md rounded-full p-2 pl-4 border border-skin-border shadow-xl pointer-events-auto ${
            isMobile ? 'px-2' : ''
          }`}
        >
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-full text-skin-text hover:bg-skin-border transition-colors hover:scale-110 focus:scale-110 active:scale-95 duration-150 pointer-events-auto ${
                (!graphData?.nodes || graphData.nodes.length === 0) && !isProcessing
                  ? 'animate-pulse-glow'
                  : ''
              }`}
              aria-label="Toggle controls sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1
              className={`text-xl font-bold bg-gradient-to-r from-skin-text to-skin-accent bg-clip-text text-transparent ${
                isMobile ? 'hidden' : 'hidden sm:block'
              }`}
            >
              Synapse
            </h1>
            {(!graphData?.nodes || graphData.nodes.length === 0) && !isProcessing && (
              <div className="hidden md:flex items-center gap-2 text-sm text-skin-text-muted animate-fade-in-panel">
                <span>→</span>
                <span>Create diagrams here</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setIsSearching(true)}
              disabled={!graphData?.nodes?.length}
              className="p-2 rounded-full text-skin-text hover:bg-skin-border transition-colors hover:scale-110 focus:scale-110 active:scale-95 duration-150 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
              aria-label="Search graph"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            <button
              onClick={() => setShortcuts({ visible: true })}
              className="p-2 rounded-full text-skin-text hover:bg-skin-border transition-colors hover:scale-110 focus:scale-110 active:scale-95 duration-150 pointer-events-auto"
              aria-label="Show keyboard shortcuts"
            >
              <CommandLineIcon className="h-5 w-5" />
            </button>

            <Menu
              as="div"
              className="relative inline-block text-left pointer-events-auto"
            >
              <div>
                <Menu.Button
                  disabled={
                    isProcessing ||
                    !(
                      Array.isArray(graphData.nodes) &&
                      graphData.nodes.length > 0
                    )
                  }
                  className="inline-flex w-full justify-center items-center gap-2 rounded-full bg-skin-bg p-2 border border-skin-border text-sm font-semibold text-skin-text hover:bg-skin-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:scale-105 focus:scale-105 active:scale-95 duration-150 pointer-events-auto"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Download</span>
                </Menu.Button>
              </div>
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-skin-border rounded-md bg-skin-bg-accent shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-1 py-1 ">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDownloadSVG}
                        className={`${
                          active
                            ? 'bg-skin-border text-skin-text'
                            : 'text-skin-text'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <ArrowDownOnSquareIcon className="mr-2 h-5 w-5" />
                        SVG (Infinite Zoom, Vector)
                      </button>
                    )}
                  </Menu.Item>
                </div>
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDownloadJSON}
                        className={`${
                          active
                            ? 'bg-skin-border text-skin-text'
                            : 'text-skin-text'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <CodeBracketIcon className="mr-2 h-5 w-5" />
                        JSON (Graph Data)
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDownloadNodesCSV}
                        className={`${
                          active
                            ? 'bg-skin-border text-skin-text'
                            : 'text-skin-text'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <TableCellsIcon className="mr-2 h-5 w-5" />
                        Nodes (CSV)
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDownloadEdgesCSV}
                        className={`${
                          active
                            ? 'bg-skin-border text-skin-text'
                            : 'text-skin-text'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <TableCellsIcon className="mr-2 h-5 w-5" />
                        Edges (CSV)
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
            <div className="hidden sm:block h-6 border-l border-skin-border mx-1"></div>
            <div className="flex items-center gap-1 bg-skin-bg p-1 rounded-full border border-skin-border pointer-events-auto">
              <ThemeToggleButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-10">
        <div className="relative h-full w-full">
          <GraphVisualization
            ref={graphRef}
            data={graphData}
            setTooltip={setTooltip}
            setSelectedNode={setSelectedNode}
            setSelectedEdge={setSelectedEdge}
            onGraphReady={setIsGraphReady}
            diagramType={currentDiagramType}
            onNodeContextMenu={handleNodeContextMenu}
            onEdgeContextMenu={handleEdgeContextMenu}
            onBackgroundContextMenu={handleBackgroundContextMenu}
            flowchartDirection={flowchartDirection}
            isProcessing={isProcessing}
          />
          {tooltip.visible && (
            <Tooltip
              visible={tooltip.visible}
              content={tooltip.content}
              x={tooltip.x}
              y={tooltip.y}
            />
          )}

          {(!graphData?.nodes || graphData.nodes.length === 0) && !isProcessing && (
            <WelcomeScreen
              onDiagramTypeSelect={(type) => {
                setCurrentDiagramType(type);
                toggleSidebar();
              }}
              onOpenSidebar={toggleSidebar}
            />
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 p-4 text-skin-text-muted text-xs z-20">
        Welcome, {authUser?.name || 'Guest'}!
      </footer>

      {/* Info panels with simple CSS animations */}
      {selectedNode && (
        <NodeInfoPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          panelClassName="animate-slide-up"
        />
      )}
      {selectedEdge && (
        <EdgeInfoPanel
          edge={selectedEdge}
          nodes={graphData.nodes}
          onClose={() => setSelectedEdge(null)}
          panelClassName="animate-slide-up"
        />
      )}
      
    </div>
  )
}

export default App