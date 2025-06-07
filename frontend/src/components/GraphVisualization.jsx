import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Network } from 'vis-network'
import { getNodeColor, getEdgeColor } from '../utils/colors'
import { useTheme } from '../contexts/ThemeContext'

// Helper function to create a 3D-like sphere image using a radial gradient in SVG
const createSphereImage = (color) => {
  const lighterColor = '#FFFFFF' // Highlight color for the gradient

  const svg = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="grad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${lighterColor}" stop-opacity="0.9" />
      <stop offset="30%" stop-color="${lighterColor}" stop-opacity="0.4" />
      <stop offset="100%" stop-color="${color}" />
    </radialGradient>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#grad)" />
</svg>`.trim()

  const base64 = btoa(svg.replace(/\\n/g, ''))
  return `data:image/svg+xml;base64,${base64}`
}

const GraphVisualization = forwardRef(
  ({ data, isLoading, setTooltip, setSelectedNode, physicsOptions, styleOptions }, ref) => {
    const networkRef = useRef(null)
    const networkInstance = useRef(null)
    const { theme } = useTheme()

    useImperativeHandle(ref, () => ({
      downloadGraph: () => {
        if (networkInstance.current) {
          const originalCanvas = networkInstance.current.canvas.getContext('2d').canvas
          const scaleFactor = 2 // For higher resolution
          const newCanvas = document.createElement('canvas')
          const ctx = newCanvas.getContext('2d')

          newCanvas.width = originalCanvas.width * scaleFactor
          newCanvas.height = originalCanvas.height * scaleFactor

          const bgColor = theme === 'light' ? '#ffffff' : '#212121'
          ctx.fillStyle = bgColor
          ctx.fillRect(0, 0, newCanvas.width, newCanvas.height)

          ctx.save()
          ctx.scale(scaleFactor, scaleFactor)
          ctx.drawImage(originalCanvas, 0, 0)
          ctx.restore()

          const dataURL = newCanvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.href = dataURL
          link.download = 'synapse-graph-high-resolution.png'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      },
    }))

    useEffect(() => {
      if (!networkRef.current) return

      const nodes = data.nodes.map((node) => {
        const shape = styleOptions.nodeShapes[node.type] || 'sphere'
        const color = getNodeColor(node.type, theme)

        const nodeConfig = {
          id: node.id,
          label: node.label,
          size: 30,
        }

        if (shape === 'sphere') {
          nodeConfig.shape = 'circularImage'
          nodeConfig.image = createSphereImage(color)
        } else {
          nodeConfig.shape = shape
          nodeConfig.color = {
            border: color,
            background: color,
            highlight: {
              border: color,
              background: color,
            },
          }
        }
        return nodeConfig
      })

      const edges = data.edges.map((edge) => ({
        from: edge.source,
        to: edge.target,
        label: edge.label,
        arrows: 'to',
        color: getEdgeColor(edge.sentiment),
      }))

      const options = {
        nodes: {
          font: {
            size: 14,
            face: 'Inter',
            color: theme === 'light' ? '#111827' : '#ffffff',
          },
        },
        edges: {
          width: 2,
          font: {
            size: 12,
            face: 'Inter',
            color: theme === 'light' ? '#111827' : '#E0E0E0',
            strokeWidth: 4,
            strokeColor: theme === 'light' ? '#ffffff' : '#212121',
          },
          smooth: {
            type: styleOptions.edgeStyle,
          },
        },
        physics: {
          barnesHut: {
            gravitationalConstant: physicsOptions.gravitationalConstant,
            springLength: physicsOptions.springLength,
            springConstant: 0.04,
            damping: physicsOptions.damping,
            avoidOverlap: 0.1,
          },
          stabilization: {
            iterations: 1000,
            fit: true,
          },
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          dragNodes: true,
          dragView: true,
          zoomView: true,
        },
      }

      if (networkInstance.current) {
        networkInstance.current.destroy()
      }

      networkInstance.current = new Network(
        networkRef.current,
        { nodes, edges },
        options
      )

      networkInstance.current.on('click', ({ nodes: clickedNodes }) => {
        if (clickedNodes.length > 0) {
          const nodeId = clickedNodes[0]
          const nodeInfo = data.nodes.find((n) => n.id === nodeId)
          setSelectedNode(nodeInfo)
        } else {
          setSelectedNode(null)
        }
      })

      networkInstance.current.on('hoverNode', ({ node: nodeId, event }) => {
        const node = data.nodes.find((n) => n.id === nodeId)
        if (node) {
          const content = `<b>${node.type}</b><br>${
            node.sentiment ? `Sentiment: ${node.sentiment}` : ''
          }`
          setTooltip({
            visible: true,
            content,
            x: event.clientX,
            y: event.clientY,
          })
        }
      })

      networkInstance.current.on('blurNode', () => {
        setTooltip({ visible: false, content: '', x: 0, y: 0 })
      })

      // Stop physics after initial layout to reduce sensitivity
      networkInstance.current.on('stabilizationIterationsDone', () => {
        networkInstance.current.setOptions({
          physics: false,
        })
      })

      return () => {
        if (networkInstance.current) {
          networkInstance.current.destroy()
        }
      }
    }, [data, setTooltip, setSelectedNode, theme, styleOptions])

    // Apply physics changes dynamically
    useEffect(() => {
      if (networkInstance.current) {
        networkInstance.current.setOptions({
          physics: {
            barnesHut: {
              gravitationalConstant: physicsOptions.gravitationalConstant,
              springLength: physicsOptions.springLength,
              damping: physicsOptions.damping,
            },
          },
        })
        // Briefly re-enable physics to apply changes
        networkInstance.current.setOptions({ physics: true })
        setTimeout(() => networkInstance.current.setOptions({ physics: false }), 2000)
      }
    }, [physicsOptions])

    return (
      <div className="relative h-full w-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-skin-bg-accent bg-opacity-50 z-10 rounded-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-skin-btn-primary"></div>
          </div>
        )}
        <div ref={networkRef} className="h-full w-full" />
      </div>
    )
  }
)

export default GraphVisualization