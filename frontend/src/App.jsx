import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import GraphVisualization from './components/GraphVisualization'
import { generateGraph, getHistory, deleteHistoryItem } from './services/api'
import ThemeToggleButton from './components/ThemeToggleButton'
import ControlSidebar from './components/ControlSidebar'
import NodeInfoPanel from './components/NodeInfoPanel'
import {
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  DocumentArrowDownIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import { useAuth } from './contexts/AuthContext'

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
  const [history, setHistory] = useState([])
  const [physicsOptions, setPhysicsOptions] = useState(defaultPhysicsOptions)
  const [styleOptions, setStyleOptions] = useState(defaultStyleOptions)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isGraphReady, setIsGraphReady] = useState(false)
  const graphRef = useRef(null)
  const { user, logout } = useAuth()

  const fetchHistory = useCallback(async () => {
    try {
      const userHistory = await getHistory()
      setHistory(userHistory)
    } catch (error) {
      console.error('Failed to fetch history:', error)
      if (error.response && error.response.status === 401) {
        logout()
      }
    }
  }, [logout])

  // Load history from backend on initial render
  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user, fetchHistory])

  const handleTextSubmit = async (text, imageFile, audioFile, audioVideoURL) => {
    setIsProcessing(true)
    setSelectedNode(null) // Clear selection on new graph
    setIsSidebarOpen(false) // Close sidebar on submission
    try {
      const data = await generateGraph(text, imageFile, audioFile, audioVideoURL)
      setGraphData(data)
      setGraphKey((prevKey) => prevKey + 1)
      fetchHistory() // Refresh history after generating a new graph
    } catch (error) {
      console.error('Error processing text:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadPNG = () => {
    if (graphRef.current) {
      graphRef.current.downloadGraph()
    }
  }

  const handleDownloadSVG = () => {
    if (graphRef.current) {
      graphRef.current.downloadSVG()
    }
  }

  const loadFromHistory = (historyItem) => {
    setGraphData(historyItem.graphData)
    setGraphKey((prevKey) => prevKey + 1)
    setIsSidebarOpen(false)
  }

  const handleDeleteFromHistory = async (id) => {
    try {
      await deleteHistoryItem(id)
      fetchHistory() // Refresh history after deleting an item
    } catch (error) {
      console.error('Failed to delete history item:', error)
    }
  }

  const clearHistory = async () => {
    // This would require a new backend endpoint, for now we delete one by one
    try {
      await Promise.all(history.map((item) => deleteHistoryItem(item._id)))
      fetchHistory()
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
      {tooltip.visible && (
        <div
          className="absolute bg-skin-bg-accent text-skin-text text-sm p-2 rounded-md shadow-lg pointer-events-none z-50"
          style={{ top: tooltip.y + 15, left: tooltip.x + 15 }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}

      <AnimatePresence>
        {isSidebarOpen && (
          <ControlSidebar
            isOpen={isSidebarOpen}
            onClose={toggleSidebar}
            onSubmit={handleTextSubmit}
            isProcessing={isProcessing}
            selectedNode={selectedNode}
            history={history}
            loadFromHistory={loadFromHistory}
            onDelete={handleDeleteFromHistory}
            onClear={clearHistory}
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
              <div className="flex items-center gap-1 bg-skin-bg p-1 rounded-full border border-skin-border">
                <button
                  onClick={handleDownloadPNG}
                  disabled={isProcessing || graphData.nodes.length === 0 || !isGraphReady}
                  className="p-2 rounded-full text-sm font-semibold text-skin-text hover:bg-skin-border disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110"
                  aria-label="Download graph as PNG"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDownloadSVG}
                  disabled={isProcessing || graphData.nodes.length === 0 || !isGraphReady}
                  className="p-2 rounded-full text-sm font-semibold text-skin-text hover:bg-skin-border disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110"
                  aria-label="Download graph as SVG"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                </button>
              </div>
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
            physicsOptions={physicsOptions}
            styleOptions={styleOptions}
            onGraphReady={setIsGraphReady}
          />
        </div>

        <footer className="absolute bottom-0 left-0 p-4 text-skin-text-muted text-xs">
          Welcome, {user?.name || 'Guest'}!
        </footer>
      </main>
    </div>
  )
}

export default App 