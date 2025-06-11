import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
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
      setAnswer(answer)
      setGraphData({
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
          />
        )}
      </AnimatePresence>

      <NodeInfoPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      <EdgeInfoPanel edge={selectedEdge} nodes={graphData.nodes} onClose={() => setSelectedEdge(null)} />
      <AnswerPanel answer={answer} onClose={() => setAnswer('')} />

      <main className="flex-1 flex flex-col relative">
        <header className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="max-w-screen-2xl mx-auto flex justify-between items-center bg-skin-bg-accent/80 backdrop-blur-md rounded-full p-2 pl-4 border border-skin-border shadow-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-full text-skin-text hover:bg-skin-border transition-colors"
                aria-label="Toggle controls sidebar"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold text-skin-text hidden sm:block">Synapse</h1>
            </div>

            <div className="flex items-center gap-2">
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button
                    disabled={isProcessing || !(Array.isArray(graphData.nodes) && graphData.nodes.length > 0) || !isGraphReady}
                    className="inline-flex w-full justify-center items-center gap-2 rounded-full bg-skin-bg p-2 border border-skin-border text-sm font-semibold text-skin-text hover:bg-skin-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          className={`${
                            active ? 'bg-skin-border text-skin-text' : 'text-skin-text'
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
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
                          className={`${
                            active ? 'bg-skin-border text-skin-text' : 'text-skin-text'
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
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
                          className={`${
                            active ? 'bg-skin-border text-skin-text' : 'text-skin-text'
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
                            active ? 'bg-skin-border text-skin-text' : 'text-skin-text'
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
                            active ? 'bg-skin-border text-skin-text' : 'text-skin-text'
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
              <div className="flex items-center gap-1 bg-skin-bg p-1 rounded-full border border-skin-border">
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

        <footer className="absolute bottom-0 left-0 p-4 text-skin-text-muted text-xs">
          Welcome, {user?.name || 'Guest'}!
        </footer>
      </main>

      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 rounded-full bg-skin-bg-accent text-skin-text shadow-lg hover:bg-skin-border transition-all hover:scale-110"
          aria-label="Open controls"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        <ThemeToggleButton />
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={!isGraphReady || isProcessing}
            className="p-3 rounded-full bg-skin-bg-accent text-skin-text shadow-lg hover:bg-skin-border transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export graph"
          >
            <ArrowDownOnSquareIcon className="h-6 w-6" />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-skin-bg-accent rounded-lg shadow-xl py-1 z-30">
              <button
                onClick={() => {
                  graphRef.current.downloadPNG()
                  setShowExportMenu(false)
                }}
                className="block w-full text-left px-4 py-2 text-sm text-skin-text hover:bg-skin-border"
              >
                Download PNG
              </button>
              <button
                onClick={() => {
                  graphRef.current.downloadWebP()
                  setShowExportMenu(false)
                }}
                className="block w-full text-left px-4 py-2 text-sm text-skin-text hover:bg-skin-border"
              >
                Download WebP
              </button>
              <button
                onClick={() => {
                  graphRef.current.downloadJSON()
                  setShowExportMenu(false)
                }}
                className="block w-full text-left px-4 py-2 text-sm text-skin-text hover:bg-skin-border"
              >
                Download JSON
              </button>
              <button
                onClick={() => {
                  graphRef.current.downloadNodesCSV()
                  setShowExportMenu(false)
                }}
                className="block w-full text-left px-4 py-2 text-sm text-skin-text hover:bg-skin-border"
              >
                Download Nodes (CSV)
              </button>
              <button
                onClick={() => {
                  graphRef.current.downloadEdgesCSV()
                  setShowExportMenu(false)
                }}
                className="block w-full text-left px-4 py-2 text-sm text-skin-text hover:bg-skin-border"
              >
                Download Edges (CSV)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App