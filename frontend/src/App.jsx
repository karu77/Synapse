import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import GraphVisualization from './components/GraphVisualization'
import {
  generateGraph,
  getHistory,
  deleteHistoryItem,
  clearAllHistory,
  checkTokenStatus,
  deleteAccount,
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
  UserCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from './contexts/AuthContext'
import { Menu } from '@headlessui/react'
import { Fragment } from 'react'
import Tooltip from './components/Tooltip'
import ConfirmModal from './components/ConfirmModal';

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
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
        console.log('🔄 Fetching history for user:', authUser.name)
        
        // Debug token status before making request
        const tokenStatus = checkTokenStatus()
        console.log('🔐 Token status before history fetch:', tokenStatus)
        
        const historyData = await getHistory()
        setHistory(historyData)
        console.log('✅ History fetched successfully:', historyData.length, 'items')
      } catch (error) {
        console.error('❌ Failed to fetch history:', error)
        console.log('🔍 Error details:', {
          status: error.response?.status,
          message: error.message,
          response: error.response?.data
        })
        
        // Handle authentication errors specifically
        if (error.message?.includes('Authentication required') || error.response?.status === 401) {
          console.log('🚨 Authentication failed, logging out user')
          logout() // This will redirect to login page
        }
      }
    } else {
      console.log('⚠️ No authenticated user, skipping history fetch')
    }
  }, [authUser, logout])

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
        text,
        question,
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
    if (graphRef.current && graphRef.current.exportAsSVG) {
      graphRef.current.exportAsSVG();
    } else {
      console.error('exportAsSVG method not available');
    }
  }, []);
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
    
    // For mindmaps, construct the full type with subtype if available
    let fullDiagramType = diagramType
    if (diagramType === 'mindmap' && historyItem.graphData.mindmapSubtype) {
      fullDiagramType = `${diagramType}-${historyItem.graphData.mindmapSubtype}`
    }
    
    setCurrentDiagramType(fullDiagramType)
    
    let graphData = historyItem.graphData
    const isHierarchical = (diagramType === 'flowchart') || (diagramType === 'mindmap' && fullDiagramType !== 'mindmap-radial')

    // For hierarchical diagrams, ensure all nodes have proper level properties
    if (isHierarchical && graphData.nodes) {
      graphData = {
        ...graphData,
        nodes: graphData.nodes.map(node => {
          let nodeLevel = node.level

          // If level is missing, try to infer it
          if (nodeLevel === undefined || nodeLevel === null) {
            if (diagramType === 'mindmap') {
              if (node.type === 'TOPIC' && (node.label?.toLowerCase().includes('central') || node.id === 'center')) {
                nodeLevel = 0
              } else if (node.type === 'TOPIC') {
                nodeLevel = 1
              } else if (node.type === 'SUBTOPIC') {
                nodeLevel = 2
              } else {
                nodeLevel = 3
              }
            } else if (diagramType === 'flowchart') {
              if (node.type === 'START_END' && (node.label?.toLowerCase().includes('start') || node.id?.includes('start'))) {
                nodeLevel = 0
              } else {
                nodeLevel = 1
              }
            }
          }
          
          return { ...node, level: nodeLevel }
        }),
        diagramType: diagramType
      }
    } else if (graphData.nodes) {
      // For non-hierarchical graphs (knowledge-graph, mindmap-radial), remove level properties to avoid conflicts
      graphData = {
        ...graphData,
        nodes: graphData.nodes.map(node => {
          const { level, ...nodeWithoutLevel } = node
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

  // User account action handlers
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      setShowDeleteSuccess(true);
    } catch (error) {
      console.error('Failed to delete account:', error);
      // You might want to show an error message to the user here
      setShowDeleteModal(false);
    }
  };

  const handleDeleteSuccessClose = () => {
    setShowDeleteSuccess(false);
    logout(); // Log out after user acknowledges deletion
  };

  // Responsive breakpoints
  const isMobile = windowSize.width < 768
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024

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
      
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-30 ${isMobile ? 'p-2' : 'p-4'} pointer-events-none`}>
        <div
          className={`max-w-screen-2xl mx-auto flex justify-between items-center bg-skin-bg-accent/80 backdrop-blur-md rounded-full ${isMobile ? 'p-1' : 'p-2 pl-4'} border border-skin-border shadow-xl pointer-events-auto`}
        >
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={toggleSidebar}
              className={`${isMobile ? 'p-3' : 'p-2'} rounded-full text-skin-text hover:bg-skin-border transition-colors hover:scale-110 focus:scale-110 active:scale-95 duration-150 pointer-events-auto ${
                (!graphData?.nodes || graphData.nodes.length === 0) && !isProcessing
                  ? 'animate-pulse-glow'
                  : ''
              }`}
              aria-label="Toggle controls sidebar"
            >
              <Bars3Icon className={`${isMobile ? 'h-7 w-7' : 'h-6 w-6'}`} />
            </button>
            <h1
              className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold bg-gradient-to-r from-skin-text to-skin-accent bg-clip-text text-transparent ${
                isMobile ? 'block' : 'hidden sm:block'
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
          <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'} pointer-events-auto`}>
            <button
              onClick={() => setIsSearching(true)}
              disabled={!graphData?.nodes?.length}
              className={`${isMobile ? 'p-3' : 'p-2'} rounded-full text-skin-text hover:bg-skin-border transition-colors hover:scale-110 focus:scale-110 active:scale-95 duration-150 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto`}
              aria-label="Search graph"
            >
              <MagnifyingGlassIcon className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
            </button>

            {!isMobile && (
              <button
                onClick={() => setShortcuts({ visible: true })}
                className="p-2 rounded-full text-skin-text hover:bg-skin-border transition-colors hover:scale-110 focus:scale-110 active:scale-95 duration-150 pointer-events-auto"
                aria-label="Show keyboard shortcuts"
              >
                <CommandLineIcon className="h-5 w-5" />
              </button>
            )}

            {/* User Menu */}
            <Menu as="div" className="relative inline-block text-left pointer-events-auto">
              <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-skin-text hover:bg-skin-border transition">
                <UserCircleIcon className="h-6 w-6" />
              </Menu.Button>
              <AnimatePresence>
                <Menu.Items
                  as={motion.div}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg focus:outline-none z-50 p-1"
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold truncate">Signed in as</p>
                    <p className="text-sm text-skin-text-muted truncate">{authUser.email}</p>
                  </div>
                  <div className="h-px bg-skin-border my-1" />
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active ? 'bg-gray-100 dark:bg-skin-border' : ''
                        } group flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-600 dark:text-skin-text-muted`}
                      >
                        <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                  <div className="h-px bg-skin-border my-1" />
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDeleteAccount}
                        className={`${
                          active ? 'bg-red-100 dark:bg-red-900/30' : ''
                        } group flex w-full items-center rounded-md px-3 py-2 text-sm text-red-600 dark:text-red-400`}
                      >
                        <TrashIcon className="mr-2 h-5 w-5" />
                        Delete Account
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </AnimatePresence>
            </Menu>

            {!isMobile && <div className="hidden sm:block h-6 border-l border-skin-border mx-1"></div>}
            <div className={`flex items-center gap-1 bg-skin-bg ${isMobile ? 'p-2' : 'p-1'} rounded-full border border-skin-border pointer-events-auto`}>
              <ThemeToggleButton />
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <ConfirmModal
        open={showLogoutModal}
        title="Log Out?"
        description="Are you sure you want to log out?"
        confirmText="Log Out"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
      <ConfirmModal
        open={showDeleteModal}
        title="Delete Account?"
        description="This action is irreversible and will permanently delete your account and all associated data. Are you sure you want to continue?"
        confirmText="Yes, Delete My Account"
        danger
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
      <ConfirmModal
        open={showDeleteSuccess}
        title="Account Deleted"
        description="Your account has been successfully deleted."
        confirmText="OK"
        onConfirm={handleDeleteSuccessClose}
        onCancel={handleDeleteSuccessClose}
      />

      {/* Main Content */}
      <main className={`flex-grow ${isMobile ? 'pt-20 pb-8' : 'pt-24 pb-10'}`}>
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

          {(!graphData?.nodes || graphData.nodes.length === 0) && !isProcessing && !isSidebarOpen && (
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

      {/* Other components */}
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

      {answer && (
        <div className={`fixed ${isMobile ? 'bottom-4 left-4 right-4 top-auto transform-none' : 'top-1/2 transform -translate-y-1/2'} z-40 ${isMobile ? 'w-auto' : 'max-w-xs w-full sm:w-96'} animate-fade-in-panel transition-all duration-300 ${
          isSidebarOpen && !isMobile ? 'left-[28rem]' : isMobile ? '' : 'left-4'
        } ${isSidebarOpen && isMobile ? 'hidden' : ''}`}>
          <AnswerPanel answer={answer} onClose={() => setAnswer('')} />
        </div>
      )}

      <AnimatePresence>
        {selectedNode && (
          <NodeInfoPanel
            key={selectedNode.id}
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedEdge && (
          <EdgeInfoPanel
            key={selectedEdge.id}
            edge={selectedEdge}
            nodes={graphData.nodes}
            onClose={() => setSelectedEdge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App