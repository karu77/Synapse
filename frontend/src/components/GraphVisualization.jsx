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
          const scaleFactor = 4 // For higher resolution
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
      downloadSVG: () => {
        if (!networkInstance.current) return

        const network = networkInstance.current
        const nodes = data.nodes
        const edges = data.edges
        const nodePositions = network.getPositions()
        const boundingBox = network.getBoundingBox()
        const padding = 50
        const width = boundingBox.right - boundingBox.left + 2 * padding
        const height = boundingBox.bottom - boundingBox.top + 2 * padding
        const viewBox = `${boundingBox.left - padding} ${
          boundingBox.top - padding
        } ${width} ${height}`
        const bgColor = theme === 'light' ? '#ffffff' : '#212121'
        const textColor = theme === 'light' ? '#111827' : '#ffffff'

        let svgDefs = `<defs>`
        const gradients = {}
        let gradCounter = 0

        // Create gradients for sphere nodes and a single arrow marker
        svgDefs += `
<marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
</marker>`

        nodes.forEach((node) => {
          const shape = styleOptions.nodeShapes[node.type] || 'sphere'
          if (shape === 'sphere') {
            const color = getNodeColor(node.type, theme)
            if (!gradients[color]) {
              const gradId = `grad-${gradCounter++}`
              svgDefs += `
<radialGradient id="${gradId}" cx="35%" cy="35%" r="65%">
  <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
  <stop offset="30%" stop-color="#FFFFFF" stop-opacity="0.4" />
  <stop offset="100%" stop-color="${color}" />
</radialGradient>`
              gradients[color] = gradId
            }
          }
        })
        svgDefs += `</defs>`

        let edgePaths = '<g>'
        edges.forEach((edge) => {
          const fromPos = nodePositions[edge.source]
          const toPos = nodePositions[edge.target]
          if (!fromPos || !toPos) return

          const edgeColor = getEdgeColor(edge.sentiment)
          const nodeSize = 30
          const dx = toPos.x - fromPos.x
          const dy = toPos.y - fromPos.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const newToX = toPos.x - (dx / dist) * (nodeSize + 5) // +5 for padding
          const newToY = toPos.y - (dy / dist) * (nodeSize + 5)

          edgePaths += `<line x1="${fromPos.x}" y1="${fromPos.y}" x2="${newToX}" y2="${newToY}" stroke="${edgeColor}" stroke-width="2" marker-end="url(#arrowhead)" color="${edgeColor}" />`

          const midX = (fromPos.x + toPos.x) / 2
          const midY = (fromPos.y + toPos.y) / 2
          const edgeLabelColor = theme === 'light' ? '#111827' : '#E0E0E0'
          edgePaths += `<text x="${midX}" y="${midY}" font-family="Inter" font-size="12" fill="${edgeLabelColor}" text-anchor="middle" dominant-baseline="central" style="paint-order: stroke; stroke: ${bgColor}; stroke-width: 4px; stroke-linecap: butt; stroke-linejoin: miter;">${edge.label}</text>`
        })
        edgePaths += '</g>'

        let nodeElements = '<g>'
        nodes.forEach((node) => {
          const pos = nodePositions[node.id]
          if (!pos) return

          const color = getNodeColor(node.type, theme)
          const shape = styleOptions.nodeShapes[node.type] || 'sphere'
          const nodeSize = 30

          if (shape === 'sphere') {
            const gradId = gradients[color]
            nodeElements += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeSize}" fill="url(#${gradId})" />`
          } else if (shape === 'box' || shape === 'square') {
            nodeElements += `<rect x="${pos.x - nodeSize}" y="${
              pos.y - nodeSize
            }" width="${nodeSize * 2}" height="${nodeSize * 2}" fill="${color}" />`
          } else if (shape === 'diamond') {
            nodeElements += `<rect x="${pos.x - nodeSize}" y="${
              pos.y - nodeSize
            }" width="${nodeSize * 2}" height="${
              nodeSize * 2
            }" fill="${color}" transform="rotate(45, ${pos.x}, ${pos.y})" />`
          } else {
            nodeElements += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeSize}" fill="${color}" />`
          }
          nodeElements += `<text x="${pos.x}" y="${
            pos.y + nodeSize + 14
          }" font-family="Inter" font-size="14" fill="${textColor}" text-anchor="middle">${
            node.label
          }</text>`
        })
        nodeElements += '</g>'

        const svgString = `
<svg width="${Math.round(width)}" height="${Math.round(
          height
        )}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${viewBox.split(' ')[0]}" y="${
          viewBox.split(' ')[1]
        }" width="${width}" height="${height}" fill="${bgColor}" />
  ${svgDefs}
  ${edgePaths}
  ${nodeElements}
</svg>`

        const blob = new Blob([svgString], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'synapse-graph.svg'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
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