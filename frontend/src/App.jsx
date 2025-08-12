import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import GraphVisualization from './components/GraphVisualization'
import './App.css'
import {
  generateGraph,
  getHistory,
  deleteHistoryItem,
  clearAllHistory,
  checkTokenStatus,
  deleteAccount,
  updateHistoryName,
} from './services/api'
import ThemeToggleButton from './components/ThemeToggleButton'
import ControlSidebar from './components/ControlSidebar'
import NodeInfoPanel from './components/NodeInfoPanel'
import EdgeInfoPanel from './components/EdgeInfoPanel'
import AnswerPanel from './components/AnswerPanel'
import WelcomeScreen from './components/WelcomeScreen'
import PresetExamples from './components/PresetExamples'
import TutorialModal from './components/TutorialModal'
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
import { useTheme } from './contexts/ThemeContext'
import { Fragment } from 'react'
import Tooltip from './components/Tooltip'
import ConfirmModal from './components/ConfirmModal';
// import AiInfoPanel from './components/AiInfoPanel';
import Joyride from 'react-joyride';
import { updateTutorialSeen } from './services/api';

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
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiReferences, setAiReferences] = useState([]);
  const [showPresetExamples, setShowPresetExamples] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [graphName, setGraphName] = useState('Untitled Graph')
  const [isEditingName, setIsEditingName] = useState(false)
  const [currentHistoryId, setCurrentHistoryId] = useState(null)
  const graphRef = useRef(null)
  const containerRef = useRef(null)
  const onGraphReadyRef = useRef(null)
  const { user: authUser, logout, markTutorialSeen } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  // Tutorial modal state
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);
  const [joyrideKey, setJoyrideKey] = useState(0);

  console.log('App render, user:', user);
  console.log('Current theme:', theme);

  // Preset examples handlers
  const handleLoadExample = (exampleData, diagramType) => {
    setGraphData(exampleData);
    setCurrentDiagramType(diagramType);
    setAnswer('Example loaded successfully!');
    setShowPresetExamples(false);
    setIsSidebarOpen(false);
    setGraphKey((prevKey) => prevKey + 1);
  };

  const handlePreviewExample = (exampleData, diagramType) => {
    // Temporarily show the example without changing the current state
    const originalData = graphData;
    const originalType = currentDiagramType;
    
    setGraphData(exampleData);
    setCurrentDiagramType(diagramType);
    
    // Restore original data after 5 seconds
    setTimeout(() => {
      setGraphData(originalData);
      setCurrentDiagramType(originalType);
    }, 5000);
  };

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

  // Debug state changes
  useEffect(() => {
    console.log('selectedNode changed:', selectedNode);
  }, [selectedNode]);
  
  useEffect(() => {
    console.log('selectedEdge changed:', selectedEdge);
  }, [selectedEdge]);

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
      const network = graphRef.current?.getNetwork();
      if (network) {
        network.selectNodes(matchingNodes.map(node => node.id));
        network.focus(matchingNodes[0].id, {
          scale: 1.2,
          animation: {
            duration: 1000,
            easingFunction: 'easeInOutQuad'
          }
        });
        // Show feedback
        setTooltip({
          visible: true,
          content: `Found ${matchingNodes.length} matching node${matchingNodes.length > 1 ? 's' : ''}`,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        });
        setTimeout(() => setTooltip({ visible: false, content: '', x: 0, y: 0 }), 2000);
      } else {
        console.warn('Network not available for search');
        // Fallback: just select nodes without focusing
        setTooltip({
          visible: true,
          content: `Found ${matchingNodes.length} matching node${matchingNodes.length > 1 ? 's' : ''} (network not ready)`,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        });
        setTimeout(() => setTooltip({ visible: false, content: '', x: 0, y: 0 }), 2000);
      }
    } else {
      // No results found
      setTooltip({
        visible: true,
        content: 'No matching nodes found',
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      });
      setTimeout(() => setTooltip({ visible: false, content: '', x: 0, y: 0 }), 2000);
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
        // PATCH: Log diagramType for each item
        console.log('✅ History fetched successfully:', historyData.length, 'items')
        historyData.forEach((item, idx) => {
          console.log(`History[${idx}] diagramType:`, item.inputs?.diagramType, item.graphData?.diagramType)
        })
      } catch (error) {
        console.error('Failed to fetch history:', error)
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

  // When you set the answer, also set aiReferences if available from backend (for now fallback to empty array)
  const handleTextSubmit = async (text, question, imageFile, audioFile, documentFile, imageUrl, audioUrl, diagramType) => {
    setIsProcessing(true)
    setSelectedNode(null)
    setSelectedEdge(null)
    setAnswer('')
    setIsSidebarOpen(false)
    
    setCurrentDiagramType(diagramType)
    
    // Generate a descriptive name based on content
    const generateGraphName = (text, question, diagramType) => {
      const content = question || text || '';
      if (!content.trim()) return 'Untitled Graph';
      
      // Extract first meaningful phrase (up to 50 characters)
      const words = content.trim().split(/\s+/);
      let name = '';
      
      for (let i = 0; i < words.length; i++) {
        const testName = name + (name ? ' ' : '') + words[i];
        if (testName.length > 50) break;
        name = testName;
      }
      
      // Add diagram type if it's not already in the name
      const diagramTypeName = diagramType === 'knowledge-graph' ? 'Knowledge Graph' :
                             diagramType === 'flowchart' ? 'Flowchart' :
                             diagramType.startsWith('mindmap') ? 'Mind Map' :
                             diagramType.charAt(0).toUpperCase() + diagramType.slice(1);
      
      if (!name.toLowerCase().includes(diagramTypeName.toLowerCase())) {
        name = `${name} - ${diagramTypeName}`;
      }
      
      return name || 'Untitled Graph';
    };
    
    const descriptiveName = generateGraphName(text, question, diagramType);
    setGraphName(descriptiveName);
    
    try {
      const { answer, graphData } = await generateGraph(
        text,
        question,
        imageFile,
        audioFile,
        documentFile,
        imageUrl,
        audioUrl,
        diagramType,
        descriptiveName // pass the generated name
      )
      setAnswer(answer)
      // Aggregate all unique references from all nodes
      const allReferences = [
        ...new Set(
          (graphData?.nodes || [])
            .flatMap(node => node.references || [])
            .filter(Boolean)
        )
      ];
      setAiReferences(allReferences);
      setGraphData({
        nodes: Array.isArray(graphData?.nodes) ? graphData.nodes : [],
        edges: Array.isArray(graphData?.edges) ? graphData.edges : [],
        diagramType: diagramType
      })
      setGraphKey((prevKey) => prevKey + 1)
      await fetchHistory()
      // After fetching, set the currentHistoryId to the latest item
      if (history && history.length > 0) {
        setCurrentHistoryId(history[0]._id)
      }
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

  // When loading from history, set the graph name and ID
  const loadFromHistory = (historyItem) => {
    setGraphName(historyItem.name || 'Untitled Graph')
    setCurrentHistoryId(historyItem._id || null)
    console.log('Loading from history:', historyItem)
    setSelectedNode(null)
    setSelectedEdge(null)
    
    // Ensure the diagram type is set before the graph data
    let diagramType = historyItem.graphData.diagramType || historyItem.inputs.diagramType || 'knowledge-graph'
    
    // For mindmaps, construct the full type with subtype if available
    let fullDiagramType = diagramType
    if (diagramType === 'mindmap' && historyItem.graphData.mindmapSubtype) {
      fullDiagramType = `${diagramType}-${historyItem.graphData.mindmapSubtype}`
    }

    // --- PATCH: Robustly handle knowledge-graph history ---
    if (!diagramType || diagramType === 'knowledge-graph' || fullDiagramType === 'knowledge-graph') {
      diagramType = 'knowledge-graph';
      fullDiagramType = 'knowledge-graph';
    }
    setCurrentDiagramType(fullDiagramType)
    
    let graphData = historyItem.graphData
    // Defensive: ensure nodes/edges are arrays
    const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : []
    const edges = Array.isArray(graphData.edges) ? graphData.edges : []
    const isHierarchical = (diagramType === 'flowchart') || (diagramType === 'mindmap' && fullDiagramType !== 'mindmap-radial')

    if (isHierarchical && nodes.length > 0) {
      graphData = {
        ...graphData,
        nodes: nodes.map(node => {
          let nodeLevel = node.level
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
        edges,
        diagramType: fullDiagramType
      }
    } else if (nodes.length > 0) {
      // For non-hierarchical graphs (knowledge-graph, mindmap-radial), remove level properties
      graphData = {
        ...graphData,
        nodes: nodes.map(node => {
          const { level, ...nodeWithoutLevel } = node
          return nodeWithoutLevel
        }),
        edges,
        diagramType: fullDiagramType
      }
    } else {
      // Defensive fallback for empty or malformed data
      graphData = { nodes: [], edges: [], diagramType: fullDiagramType }
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
    console.log('🔐 App: handleLogout called')
    console.log('🔐 App: Setting showLogoutModal to true')
    setShowUserModal(false); // Close the user menu modal first
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    console.log('🔐 App: confirmLogout called')
    logout();
    navigate('/login'); // Navigate to login page after logout
    setShowLogoutModal(false);
  };

  const handleDeleteAccount = () => {
    console.log('🔐 App: handleDeleteAccount called')
    console.log('🔐 App: Setting showDeleteModal to true')
    setShowUserModal(false); // Close the user menu modal first
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    console.log('🔐 App: confirmDeleteAccount called')
    try {
      await deleteAccount();
      console.log('🔐 App: deleteAccount successful')
      setShowDeleteModal(false);
      setShowDeleteSuccess(true);
    } catch (error) {
      console.error('🔐 App: Failed to delete account:', error);
      // You might want to show an error message to the user here
      setShowDeleteModal(false);
    }
  };

  const handleDeleteSuccessClose = () => {
    console.log('🔐 App: handleDeleteSuccessClose called')
    setShowDeleteSuccess(false);
    logout(); // Log out after user acknowledges deletion
    navigate('/login'); // Navigate to login page after logout
  };

  // Debug modal states
  useEffect(() => {
    console.log('🔐 App: Modal states changed:', {
      showLogoutModal,
      showDeleteModal,
      showDeleteSuccess,
      showUserModal
    });
  }, [showLogoutModal, showDeleteModal, showDeleteSuccess, showUserModal]);

  // Responsive breakpoints
  const isMobile = windowSize.width < 768
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024
  const isSmallPhone = windowSize.width < 375
  const isMediumPhone = windowSize.width >= 375 && windowSize.width < 425
  const isLargePhone = windowSize.width >= 425 && windowSize.width < 768

  // Robustly open all diagrams after data is set
  useEffect(() => {
    if (graphRef.current && graphData.nodes && graphData.nodes.length > 0) {
      const network = graphRef.current.getNetwork?.();
      if (network) {
        // Explicitly set data to ensure network is up to date
        network.setData({
          nodes: graphData.nodes,
          edges: (graphData.edges || []).map(e => ({ ...e, from: e.source, to: e.target }))
        });
        setTimeout(() => {
          if (typeof network.stabilize === 'function') {
            network.stabilize();
          }
          network.fit({ animation: { duration: 800, easingFunction: 'easeInOutQuad' } });
        }, 120);
      }
    }
    // Only run when graphData changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData, currentDiagramType]);

  // Editable name UI (top left, Google Docs style)
  // When editing ends, update the backend if we have an ID
  const handleNameEditEnd = async () => {
    setIsEditingName(false)
    if (currentHistoryId && graphName.trim()) {
      try {
        await updateHistoryName(currentHistoryId, graphName)
        await fetchHistory()
      } catch (e) {
        // Optionally show error
      }
    }
  }

  useEffect(() => {
    // Show tutorial modal for new users
    if (authUser && !authUser.hasSeenTutorial) {
      setShowTutorialModal(true);
    }
  }, [authUser]);

  const handleStartTutorial = () => {
    setShowTutorialModal(false);
    setRunTutorial(true);
  };
  
  const handleSkipTutorial = async () => {
    setShowTutorialModal(false);
    setRunTutorial(false);
    try {
      await markTutorialSeen();
    } catch {}
  };

  // Remove the debug step from Joyride steps
  const tutorialSteps = [
    {
      target: '.sidebar-joyride',
      content: 'This is your sidebar. Use it to access controls and history!',
    },
    {
      target: '.graph-area-joyride',
      content: 'Here is where your diagrams will appear.',
    },
    {
      target: '.history-panel-joyride',
      content: 'Access your previous diagrams here.',
    },
    {
      target: '.graph-name-joyride',
      content: 'You can name your graph here. Click to edit!',
    },
  ];

  const handleJoyrideCallback = async (data) => {
    if (['finished', 'skipped'].includes(data.status)) {
      setRunTutorial(false);
      try {
        await markTutorialSeen();
        // Optionally update user context/state here if needed
      } catch {}
    }
  };

  // Minimal Joyride test: always run, single step
  // Render only the tutorial modal if it's open
  if (showTutorialModal) {
    return (
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        onStartTutorial={handleStartTutorial}
        onSkip={handleSkipTutorial}
      />
    );
  }

  return (
    <div className={`h-screen w-screen overflow-hidden bg-skin-bg text-skin-text font-sans flex flex-col ${isMobile ? (isSmallPhone ? 'small-phone' : isMediumPhone ? 'medium-phone' : 'large-phone') : ''}`}>
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
            className={`bg-skin-bg-accent rounded-2xl ${isMobile ? (isSmallPhone ? 'p-3' : 'p-4') : 'p-6'} ${isMobile ? (isSmallPhone ? 'max-w-xs' : 'max-w-sm') : 'max-w-md'} w-full border border-skin-border shadow-2xl`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className={`${isMobile ? (isSmallPhone ? 'text-sm' : 'text-base') : 'text-lg'} font-bold mb-4 text-skin-text`}>Keyboard Shortcuts</h3>
            <div className={`space-y-2 ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-sm'}`}>
              <div className="flex justify-between">
                <span className="text-skin-text-muted">Open Controls</span>
                <kbd className={`px-2 py-1 bg-skin-border rounded ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-xs'}`}>Ctrl+K</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-skin-text-muted">Fit to View</span>
                <kbd className={`px-2 py-1 bg-skin-border rounded ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-xs'}`}>Ctrl+F</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-skin-text-muted">Search</span>
                <kbd className={`px-2 py-1 bg-skin-border rounded ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-xs'}`}>Ctrl+/</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-skin-text-muted">Close/Escape</span>
                <kbd className={`px-2 py-1 bg-skin-border rounded ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-xs'}`}>Esc</kbd>
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
          className={`fixed inset-0 z-[50] bg-black/30 backdrop-blur-sm flex items-start justify-center ${isMobile ? 'pt-16' : 'pt-20'}`}
          onClick={() => setIsSearching(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            className={`bg-skin-bg-accent rounded-2xl ${isMobile ? (isSmallPhone ? 'p-2 mx-2' : 'p-3 mx-3') : 'p-4 mx-4'} ${isMobile ? (isSmallPhone ? 'max-w-xs' : 'max-w-sm') : 'max-w-lg'} w-full border border-skin-border shadow-2xl`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <MagnifyingGlassIcon className={`${isMobile ? (isSmallPhone ? 'h-3.5 w-3.5' : 'h-4 w-4') : 'h-5 w-5'} text-skin-text-muted`} />
              <input
                type="text"
                placeholder={isMobile ? (isSmallPhone ? "Search..." : "Search...") : "Search nodes, types, or descriptions..."}
                className={`flex-1 bg-transparent text-skin-text placeholder-skin-text-muted outline-none ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : ''}`}
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
            
            {/* Search Results Preview */}
            {searchQuery.trim() && (
              <div className={`${isMobile ? (isSmallPhone ? 'max-h-24' : 'max-h-32') : 'max-h-48'} overflow-y-auto`}>
                {(() => {
                  const nodes = graphData.nodes || [];
                  const matchingNodes = nodes.filter(node => {
                    const searchableText = `${node.label} ${node.type} ${node.description || ''}`.toLowerCase();
                    return searchableText.includes(searchQuery.toLowerCase());
                  });
                  
                  if (matchingNodes.length === 0) {
                    return (
                      <div className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-sm'} text-skin-text-muted text-center py-4`}>
                        No matching nodes found
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-2">
                      <div className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-xs'} text-skin-text-muted font-medium`}>
                        Found {matchingNodes.length} matching node{matchingNodes.length > 1 ? 's' : ''}
                      </div>
                      {matchingNodes.slice(0, isMobile ? (isSmallPhone ? 2 : 3) : 5).map((node, index) => (
                        <button
                          key={node.id}
                          className={`w-full text-left ${isMobile ? (isSmallPhone ? 'p-1.5' : 'p-2') : 'p-2'} rounded-lg hover:bg-skin-border transition-colors ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-sm'}`}
                          onClick={() => {
                            handleSearch(node.label);
                            setIsSearching(false);
                          }}
                        >
                          <div className={`font-medium text-skin-text ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : ''}`}>{node.label}</div>
                          <div className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-xs'} text-skin-text-muted`}>{node.type}</div>
                        </button>
                      ))}
                      {matchingNodes.length > (isMobile ? (isSmallPhone ? 2 : 3) : 5) && (
                        <div className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-xs'} text-skin-text-muted text-center py-2`}>
                          ... and {matchingNodes.length - (isMobile ? (isSmallPhone ? 2 : 3) : 5)} more
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
      
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-30 ${isMobile ? (isSmallPhone ? 'p-0.5' : 'p-2') : 'p-4'} pointer-events-none`}>
        <div
          className={`max-w-screen-2xl mx-auto flex justify-between items-center bg-skin-bg-accent/80 backdrop-blur-md rounded-full ${isMobile ? (isSmallPhone ? 'p-1' : 'p-2') : 'p-2 pl-4'} border border-skin-border shadow-xl pointer-events-auto overflow-hidden ${isMobile ? 'mobile-header' : ''}`}
        >
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={toggleSidebar}
              className={`${isMobile ? (isSmallPhone ? 'p-1.5' : 'p-2.5') : 'p-2'} rounded-full text-skin-text hover:bg-skin-border transition-colors hover:scale-110 focus:scale-110 active:scale-95 duration-150 pointer-events-auto ${
                (!graphData?.nodes || graphData.nodes.length === 0) && !isProcessing
                  ? 'animate-pulse-glow'
                  : ''
              }`}
              aria-label="Toggle controls sidebar"
            >
              <Bars3Icon className={`${isMobile ? (isSmallPhone ? 'h-4 w-4' : 'h-6 w-6') : 'h-6 w-6'}`} />
            </button>
            <h1
              className={`${isMobile ? (isSmallPhone ? 'text-sm' : 'text-lg') : 'text-xl'} font-bold bg-gradient-to-r from-skin-text to-skin-accent bg-clip-text text-transparent ${
                isMobile ? 'block' : 'hidden sm:block'
              }`}
            >
              {'Synapse'}
            </h1>
            {(!graphData?.nodes || graphData.nodes.length === 0) && !isProcessing && (
              <div className="hidden md:flex items-center gap-2 text-sm text-skin-text-muted animate-fade-in-panel">
                <span>→</span>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-skin-text-muted truncate`}>
              Create diagrams here
            </span>
              </div>
            )}
          </div>
          <div className={`flex items-center ${isMobile ? (isSmallPhone ? 'gap-0' : 'gap-1') : 'gap-2'} pointer-events-auto`}>
            <button
              onClick={() => setShowPresetExamples(true)}
              className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-2') : 'p-2'} rounded-full text-skin-text hover:bg-skin-border transition-colors hover:scale-110 focus:scale-110 active:scale-95 duration-150 pointer-events-auto`}
              aria-label="Show preset examples"
            >
              <CodeBracketIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-5 w-5'}`} />
            </button>

            <button
              onClick={() => setIsSearching(true)}
              disabled={!graphData?.nodes?.length}
              className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-2') : 'p-2'} rounded-full text-skin-text hover:bg-skin-border transition-colors hover:scale-110 focus:scale-110 active:scale-95 duration-150 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto`}
              aria-label="Search graph"
            >
              <MagnifyingGlassIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-5 w-5'}`} />
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
            <button
              onClick={() => setShowUserModal(true)}
              className={`flex items-center gap-2 ${isMobile ? (isSmallPhone ? 'px-0.5 py-0.5' : 'px-1.5 py-1.5') : 'px-2 py-2'} rounded-full text-sm font-medium text-skin-text hover:bg-skin-border transition`}
              aria-label="User menu"
            >
              <UserCircleIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-6 w-6'}`} />
            </button>

            {!isMobile && <div className="hidden sm:block h-6 border-l border-skin-border mx-1"></div>}
            <div className={`flex items-center gap-1 bg-skin-bg ${isMobile ? (isSmallPhone ? 'p-0' : 'p-1') : 'p-1'} rounded-full border border-skin-border pointer-events-auto`}>
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
      <main className={`flex-grow ${isMobile ? (isSmallPhone ? 'pt-12 pb-2' : 'pt-16 pb-4') : 'pt-24 pb-10'}`}>
        <div className="relative h-full w-full">
          <Joyride
            key={joyrideKey}
            steps={tutorialSteps}
            run={runTutorial}
            continuous
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{ options: { zIndex: 10000 } }}
          />
          {/* Tutorial Modal */}
          <TutorialModal
            isOpen={showTutorialModal}
            onClose={() => setShowTutorialModal(false)}
            onStartTutorial={handleStartTutorial}
            onSkip={handleSkipTutorial}
          />
          {(graphData.nodes && graphData.nodes.length > 0) && (
            <div className={`graph-name-joyride ${isMobile ? 'block' : ''}`} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px' }}>
              {isEditingName ? (
                <input
                  type="text"
                  value={graphName}
                  autoFocus
                  onChange={e => setGraphName(e.target.value)}
                  onBlur={handleNameEditEnd}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleNameEditEnd()
                  }}
                  className="graph-name-input"
                  data-theme={theme}
                  style={{ 
                    fontSize: isMobile ? 16 : 22,
                    caretColor: '#f59e0b',
                    color: theme === 'dark' ? '#ffffff' : '#1e293b',
                    WebkitCaretColor: '#f59e0b'
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: isMobile ? 16 : 22,
                    fontWeight: 600,
                    cursor: 'pointer',
                    minWidth: 120,
                    maxWidth: 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                    textAlign: 'center',
                  }}
                  title={graphName}
                  onClick={() => setIsEditingName(true)}
                >
                  {graphName}
                </span>
              )}
            </div>
          )}
          <GraphVisualization
            ref={graphRef}
            data={{
              ...graphData,
              nodes: (graphData.nodes || []).map(node => {
                if (currentDiagramType === 'knowledge-graph' && styleOptions.nodeShapes?.[node.type]) {
                  return {
                    ...node,
                    style: {
                      ...node.style,
                      shape: styleOptions.nodeShapes[node.type]
                    }
                  };
                }
                return node;
              })
            }}
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
            showHoverTooltip={true}
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
          
          {/* Preset Examples Modal */}
          <AnimatePresence>
            {showPresetExamples && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowPresetExamples(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`bg-skin-bg-accent rounded-2xl ${isMobile ? (isSmallPhone ? 'p-2' : 'p-4') : 'p-6'} ${isMobile ? (isSmallPhone ? 'max-w-[280px]' : 'max-w-sm') : 'max-w-4xl'} w-full ${isMobile ? (isSmallPhone ? 'max-h-[70vh]' : 'max-h-[80vh]') : 'max-h-[90vh]'} overflow-y-auto border border-skin-border shadow-2xl`}
                  onClick={e => e.stopPropagation()}
                >
                  <PresetExamples
                    onLoadExample={handleLoadExample}
                    onPreviewExample={handlePreviewExample}
                    isMobile={isMobile}
                    isSmallPhone={isSmallPhone}
                    isMediumPhone={isMediumPhone}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Menu Modal */}
          <AnimatePresence>
            {showUserModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowUserModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`bg-skin-bg-accent rounded-2xl ${isMobile ? (isSmallPhone ? 'p-4' : 'p-5') : 'p-6'} ${isMobile ? (isSmallPhone ? 'max-w-xs' : 'max-w-sm') : 'max-w-md'} w-full border border-skin-border shadow-2xl backdrop-blur-xl`}
                  onClick={e => e.stopPropagation()}
                >
                  {/* User Info Section */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <span className="text-white font-bold text-xl">
                        {authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className={`${isMobile ? (isSmallPhone ? 'text-sm' : 'text-base') : 'text-lg'} font-semibold text-skin-text`}>
                        {authUser.name}
                      </p>
                      <p className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} text-skin-text-muted`}>
                        {authUser.email}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center justify-center px-4 py-3 ${isMobile ? (isSmallPhone ? 'text-sm' : 'text-base') : 'text-base'} text-skin-text bg-skin-bg hover:bg-skin-border rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-skin-border/50`}
                    >
                      <ArrowRightOnRectangleIcon className={`mr-3 ${isMobile ? (isSmallPhone ? 'h-4 w-4' : 'h-5 w-5') : 'h-5 w-5'}`} />
                      Sign Out
                    </button>
                    
                    <button
                      onClick={handleDeleteAccount}
                      className={`w-full flex items-center justify-center px-4 py-3 ${isMobile ? (isSmallPhone ? 'text-sm' : 'text-base') : 'text-base'} text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-red-200 dark:border-red-800/50`}
                    >
                      <TrashIcon className={`mr-3 ${isMobile ? (isSmallPhone ? 'h-4 w-4' : 'h-5 w-5') : 'h-5 w-5'}`} />
                      Delete Account
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Other components */}
      <AnimatePresence>
        {isSidebarOpen && (
            <div className="sidebar-joyride">
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
                onDownloadSVG={handleDownloadSVG}
                onDownloadJSON={handleDownloadJSON}
                onDownloadNodesCSV={handleDownloadNodesCSV}
                onDownloadEdgesCSV={handleDownloadEdgesCSV}
                hasGraphData={graphData?.nodes && graphData.nodes.length > 0}
              />
            </div>
        )}
      </AnimatePresence>

      {answer && (
        <div className={`fixed ${isMobile ? 'bottom-4 left-4 right-4 top-auto transform-none' : 'top-1/2 transform -translate-y-1/2'} z-40 ${isMobile ? 'w-auto' : 'max-w-xs w-full sm:w-96'} animate-fade-in-panel transition-all duration-300 ${
          isSidebarOpen && !isMobile ? 'left-[28rem]' : isMobile ? '' : 'left-4'
        } ${isSidebarOpen && isMobile ? 'hidden' : ''}`}
          style={{ cursor: 'default' }}
        >
          <AnswerPanel answer={answer} onClose={() => setAnswer('')} isMobile={isMobile} />
        </div>
      )}


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

      {/* Node modal, only when selectedNode is set */}
      <AnimatePresence>
        {selectedNode && (
          <NodeInfoPanel
            key={selectedNode.id}
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            references={selectedNode.references}
            recommendations={selectedNode.recommendations}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App