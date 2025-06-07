import { useState, useRef, useEffect } from 'react'
import TextInput from './components/TextInput'
import GraphVisualization from './components/GraphVisualization'
import { generateGraph, getHistory, deleteHistoryItem } from './services/api'
import NodeInfoPanel from './components/NodeInfoPanel'
import ThemeToggleButton from './components/ThemeToggleButton'
import HistoryPanel from './components/HistoryPanel'
import CustomizationPanel from './components/CustomizationPanel'
import StyleCustomizationPanel from './components/StyleCustomizationPanel'
import { ArrowDownTrayIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
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
  const graphRef = useRef(null)
  const { user, logout } = useAuth()

  const fetchHistory = async () => {
    try {
      const userHistory = await getHistory()
      setHistory(userHistory)
    } catch (error) {
      console.error('Failed to fetch history:', error)
      // Potentially handle token expiry here, e.g., by logging out
      if (error.response && error.response.status === 401) {
        logout()
      }
    }
  }

  // Load history from backend on initial render
  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user])

  const handleTextSubmit = async (text, imageFile, audioFile, audioVideoURL) => {
    setIsProcessing(true)
    setSelectedNode(null) // Clear selection on new graph
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const handleDownload = () => {
    if (graphRef.current) {
      graphRef.current.downloadGraph()
    }
  }

  const loadFromHistory = (historyItem) => {
    setGraphData(historyItem.graphData)
    setGraphKey((prevKey) => prevKey + 1)
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

  return (
    <div className="min-h-screen flex flex-col font-sans p-4 md:p-8 relative">
      {tooltip.visible && (
        <div
          className="absolute bg-skin-bg-accent text-skin-text text-sm p-2 rounded-md shadow-lg pointer-events-none z-50"
          style={{ top: tooltip.y + 15, left: tooltip.x + 15 }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
      <header className="w-full max-w-7xl mx-auto mb-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-skin-text">Synapse</h1>
          {user && (
            <span className="text-skin-text-muted hidden md:block">Welcome, {user.name}!</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <button
            onClick={logout}
            className="p-2 rounded-full text-skin-text hover:bg-skin-bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-skin-border transition-colors"
            aria-label="Logout"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex w-full max-w-7xl mx-auto items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Text Input & Node Info */}
          <div className="lg:col-span-1 bg-skin-bg-accent rounded-3xl shadow-lg p-8 transition-shadow duration-300 hover:shadow-2xl flex flex-col">
            <div className="flex-grow">
              <h2 className="text-3xl font-bold text-skin-text mb-6">Text & Multimodal Input</h2>
              <TextInput onSubmit={handleTextSubmit} isProcessing={isProcessing} />
            </div>
            <NodeInfoPanel node={selectedNode} />
            <HistoryPanel
              history={history}
              onSelect={loadFromHistory}
              onDelete={handleDeleteFromHistory}
              onClear={clearHistory}
            />
            <StyleCustomizationPanel
              options={styleOptions}
              onUpdate={setStyleOptions}
              onReset={resetStyles}
            />
            <CustomizationPanel
              options={physicsOptions}
              onUpdate={setPhysicsOptions}
              onReset={resetPhysics}
            />
          </div>

          {/* Right Panel: Graph Output (takes 2/3 of the space on large screens) */}
          <div className="lg:col-span-2 bg-skin-bg-accent rounded-3xl shadow-lg p-6 transition-shadow duration-300 hover:shadow-2xl flex flex-col h-[75vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-2xl font-bold text-skin-text">Knowledge Graph Output</h2>
              <button
                onClick={handleDownload}
                disabled={isProcessing || graphData.nodes.length === 0}
                className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold text-skin-text bg-skin-bg border border-skin-border hover:bg-skin-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Download graph"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download
              </button>
            </div>
            <div className="flex-grow">
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
          </div>
        </div>
      </main>

      <footer className="w-full text-center text-skin-text-muted text-sm py-6">
        &copy; {new Date().getFullYear()} Synapse. All rights reserved.
      </footer>
    </div>
  )
}

export default App 