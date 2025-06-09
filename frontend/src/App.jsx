import { useState, useRef, useEffect, useCallback } from 'react'
import GraphVisualization from './components/GraphVisualization'
import { generateGraph, getHistory, deleteHistoryItem } from './services/api'
import ThemeToggleButton from './components/ThemeToggleButton'
import ControlSidebar from './components/ControlSidebar'
import {
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  DocumentArrowDownIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import { useAuth } from './contexts/AuthContext'

const defaultPhysicsOptions = {
  gravitationalConstant: -8000,
  springLength: 250,
  springConstant: 0.04,
  damping: 0.09,
}

const defaultStyleOptions = {
  edgeStyle: 'continuous',
  nodeShapes: {
    PERSON: 'sphere',
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
      />

      <main className="flex-1 flex flex-col relative">
        <header className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start">
          {/* Left-side controls */}
          <div className="flex flex-col gap-2">
            <button
              onClick={toggleSidebar}
              className="p-3 rounded-full bg-skin-bg-accent text-skin-text shadow-lg hover:bg-skin-border transition-colors"
              aria-label="Toggle controls sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          {/* Right-side controls */}
          <div className="flex flex-col gap-2">
            <div className="bg-skin-bg-accent p-2 rounded-full shadow-lg flex flex-col gap-2">
              <button
                onClick={handleDownloadPNG}
                disabled={isProcessing || graphData.nodes.length === 0}
                className="p-2 rounded-full text-sm font-semibold text-skin-text hover:bg-skin-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Download graph as PNG"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleDownloadSVG}
                disabled={isProcessing || graphData.nodes.length === 0}
                className="p-2 rounded-full text-sm font-semibold text-skin-text hover:bg-skin-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Download graph as SVG"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-skin-bg-accent p-2 rounded-full shadow-lg flex flex-col gap-2">
              <ThemeToggleButton />
              <button
                onClick={logout}
                className="p-2 rounded-full text-skin-text hover:bg-skin-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-skin-border transition-colors"
                aria-label="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
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