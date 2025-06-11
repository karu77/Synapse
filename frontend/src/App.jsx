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
import {
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  DocumentArrowDownIcon,
  Bars3Icon,
  CodeBracketIcon,
  TableCellsIcon,
  ArrowDownOnSquareIcon,
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
    PERSON: 'dot',
    ORG: 'box',
    LOCATION: 'diamond',
    DATE: 'triangle',
    EVENT: 'star',
  },
}

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] })
  const [isProcessing, setIsProcessing] = useState(false)
  const [graphKey, setGraphKey] = useState(0)
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: '',
    x: 0,
    y: 0,
  })
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [answer, setAnswer] = useState('')
  const [history, setHistory] = useState([])
  const [physicsOptions, setPhysicsOptions] = useState(defaultPhysicsOptions)
  const [styleOptions, setStyleOptions] = useState(defaultStyleOptions)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isGraphReady, setIsGraphReady] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const graphRef = useRef(null)
  const { user, logout } = useAuth()

  const fetchHistory = useCallback(async () => {
    if (user) {
    try {
        const historyData = await getHistory()
        setHistory(historyData.reverse())
    } catch (error) {
      console.error('Failed to fetch history:', error)
      }
    }
  }, [user])

  // Load history from backend on initial render
  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user, fetchHistory])

  const handleTextSubmit = async (text, question, imageFile, audioFile, imageUrl, audioUrl) => {
    setIsProcessing(true)
    setSelectedNode(null)
    setSelectedEdge(null)
    setAnswer('')
    setIsSidebarOpen(false)
    try {
      const { answer, graphData } = await generateGraph(
        '', // Always leave text blank
        text || question, // Always send the user's input as the question
        imageFile,
        audioFile,
        imageUrl,
        audioUrl
      )
      console.log('Received graphData from backend:', graphData)
      setAnswer(answer)
      setGraphData({
        nodes: Array.isArray(graphData?.nodes) ? graphData.nodes : [],
        edges: Array.isArray(graphData?.edges) ? graphData.edges : []
      })
      console.log('Set graphData in state:', {
        nodes: Array.isArray(graphData?.nodes) ? graphData.nodes : [],
        edges: Array.isArray(graphData?.edges) ? graphData.edges : []
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

  const handleDownloadPNG = () => {
    if (graphRef.current) {
      graphRef.current.downloadPNG()
    }
  }

  const handleDownloadWebP = () => {
    if (graphRef.current) {
      graphRef.current.downloadWebP()
    }
  }

  const handleDownloadNodesCSV = () => {
    if (graphRef.current) {
      graphRef.current.downloadNodesCSV()
    }
  }

  const handleDownloadEdgesCSV = () => {
    if (graphRef.current) {
      graphRef.current.downloadEdgesCSV()
    }
  }

  const handleDownloadJSON = () => {
    if (graphRef.current) {
      graphRef.current.downloadJSON()
    }
  }

  const loadFromHistory = (historyItem) => {
    setSelectedNode(null)
    setSelectedEdge(null)
    setGraphData(historyItem.graphData)
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
    setStyleOptions(defaultStyleOptions)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-skin-bg text-skin-text font-sans flex">
      <Tooltip {...tooltip} />

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-40 w-full max-w-md bg-skin-bg-accent shadow-2xl border-r border-skin-border animate-fade-in-panel"
            style={{ maxWidth: 400 }}
          >
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
              user={user}
              logout={logout}
              alwaysShowMediaInputs={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Move AI Answer panel to the left, vertically centered, and always visible */}
      {answer && (
        <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-30 max-w-xs w-full sm:w-96 animate-fade-in-panel">
          <AnswerPanel answer={answer} onClose={() => setAnswer('')} />
        </div>
      )}

      {/* Node info panel: only show if a node is selected and no edge is selected */}
      {selectedNode && !selectedEdge && (
        <NodeInfoPanel node={selectedNode} onClose={() => setSelectedNode(null)} panelClassName="animate-fade-in-panel glass-panel" />
      )}
      {/* Edge (connection line) info panel: only show if an edge is selected and no node is selected */}
      {selectedEdge && !selectedNode && (
        <EdgeInfoPanel edge={selectedEdge} nodes={graphData.nodes} onClose={() => setSelectedEdge(null)} panelClassName="animate-fade-in-panel glass-panel" />
      )}

      <main className="flex-1 flex flex-col relative animate-fade-in-panel">
        <header className="absolute top-0 left-0 right-0 z-20 p-4 animate-fade-in-panel">
          <div className="max-w-screen-2xl mx-auto flex justify-between items-center bg-skin-bg-accent/80 backdrop-blur-md rounded-full p-2 pl-4 border border-skin-border shadow-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-full text-skin-text hover:bg-skin-border transition-colors hover:scale-110 focus:scale-110 active:scale-95 duration-150"
                aria-label="Toggle controls sidebar"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold text-skin-text hidden sm:block animate-fade-in-panel">Synapse</h1>
            </div>
            <div className="flex items-center gap-2">
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button
                    disabled={isProcessing || !(Array.isArray(graphData.nodes) && graphData.nodes.length > 0) || !isGraphReady}
                    className="inline-flex w-full justify-center items-center gap-2 rounded-full bg-skin-bg p-2 border border-skin-border text-sm font-semibold text-skin-text hover:bg-skin-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:scale-105 focus:scale-105 active:scale-95 duration-150"
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
                          onClick={handleDownloadPNG}
                          className={`${active ? 'bg-skin-border text-skin-text' : 'text-skin-text'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
                          PNG (High-Res)
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleDownloadWebP}
                          className={`${active ? 'bg-skin-border text-skin-text' : 'text-skin-text'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <DocumentArrowDownIcon className="mr-2 h-5 w-5" />
                          WebP (High-Quality)
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleDownloadJSON}
                          className={`${active ? 'bg-skin-border text-skin-text' : 'text-skin-text'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
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
                          className={`${active ? 'bg-skin-border text-skin-text' : 'text-skin-text'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
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
                          className={`${active ? 'bg-skin-border text-skin-text' : 'text-skin-text'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
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
              <div className="flex items-center gap-1 bg-skin-bg p-1 rounded-full border border-skin-border animate-fade-in-panel">
                <ThemeToggleButton />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-grow h-full w-full">
          <GraphVisualization
            ref={graphRef}
            key={graphKey}
            data={graphData}
            isLoading={isProcessing}
            setTooltip={setTooltip}
            setSelectedNode={setSelectedNode}
            setSelectedEdge={setSelectedEdge}
            physicsOptions={physicsOptions}
            styleOptions={styleOptions}
            onGraphReady={setIsGraphReady}
          />
        </div>

        <footer className="absolute bottom-0 left-0 p-4 text-skin-text-muted text-xs animate-fade-in-panel">
          Welcome, {user?.name || 'Guest'}!
        </footer>
      </main>
      <style>{`
        .glass-panel {
          background: linear-gradient(135deg, rgba(40,40,50,0.65) 60%, rgba(80,120,255,0.18) 100%);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 1.5px 8px 0 rgba(80,120,255,0.12);
          backdrop-filter: blur(18px) saturate(180%) brightness(1.15);
          -webkit-backdrop-filter: blur(18px) saturate(180%) brightness(1.15);
          border-radius: 22px;
          border: 1.5px solid rgba(255,255,255,0.18);
          transition: box-shadow 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .glass-panel:hover {
          box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.45), 0 2.5px 16px 0 rgba(80,120,255,0.18);
          background: linear-gradient(135deg, rgba(40,40,60,0.82) 60%, rgba(80,120,255,0.22) 100%);
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-panel {
          animation: fadeInPanel 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeInPanel {
          from { opacity: 0; transform: scale(0.98) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default App