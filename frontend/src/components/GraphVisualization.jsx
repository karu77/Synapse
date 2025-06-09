import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { Network } from 'vis-network'
import { getNodeColor, getEdgeColor } from '../utils/colors'
import { useTheme } from '../contexts/ThemeContext'

const escapeXml = (unsafe) => {
  if (typeof unsafe !== 'string') {
    return unsafe
  }
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
    }
  })
}

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
  (
    { data, isLoading, setTooltip, setSelectedNode, physicsOptions, styleOptions, onGraphReady },
    ref
  ) => {
    const containerRef = useRef(null)
    const networkInstance = useRef(null)
    const [isRendered, setIsRendered] = useState(false)
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
        if (
          !networkInstance.current ||
          Object.keys(networkInstance.current.body.nodes).length === 0
        ) {
          console.warn('SVG export cancelled: Network not ready or no nodes to export.')
          return
        }

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
<marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
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
          edgePaths += `<text x="${midX}" y="${midY}" font-family="Inter" font-size="12" fill="${edgeLabelColor}" text-anchor="middle" dominant-baseline="central" style="paint-order: stroke; stroke: ${bgColor}; stroke-width: 4px; stroke-linecap: butt; stroke-linejoin: miter;">${escapeXml(edge.label)}</text>`
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
          }" font-family="Inter" font-size="14" fill="${textColor}" text-anchor="middle">${escapeXml(
            node.label
          )}</text>`
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
      if (!containerRef.current) {
        return
      }
      setIsRendered(false)
      if (onGraphReady) onGraphReady(false)

      const nodesWithImages = data.nodes.map((node) => {
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

      const visData = {
        nodes: nodesWithImages,
        edges: data.edges,
      }

      const options = {
        autoResize: true,
        height: '100%',
        width: '100%',
        nodes: {
          shape: 'dot',
          size: 30,
          font: {
            size: 14,
            color: theme === 'light' ? '#111827' : '#ffffff',
            face: 'Inter',
          },
          borderWidth: 2,
          shadow: true,
        },
        edges: {
          width: 2,
          font: {
            size: 12,
            color: theme === 'light' ? '#111827' : '#E0E0E0',
            strokeWidth: 4,
            strokeColor: theme === 'light' ? '#ffffff' : '#212121',
          },
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 0.8,
            },
          },
          smooth: {
            enabled: true,
            type: 'dynamic',
          },
        },
        physics: {
          ...physicsOptions,
          solver: 'barnesHut',
          barnesHut: {
            gravitationalConstant: -3000,
            centralGravity: 0.1,
            springLength: 150,
            springConstant: 0.05,
            damping: 0.1,
            avoidOverlap: 0.5,
          },
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
        },
        layout: {
          improvedLayout: true,
        },
      }

      const network = new Network(containerRef.current, visData, options)
      networkInstance.current = network

      network.on('click', (event) => {
        if (event.nodes.length > 0) {
          const nodeId = event.nodes[0]
          const node = data.nodes.find((n) => n.id === nodeId)
          setSelectedNode(node)
        } else {
          // If a user clicks on the background, deselect node
          setSelectedNode(null)
        }
      })

      network.on('hoverNode', ({ node, event }) => {
        const nodeData = data.nodes.find((n) => n.id === node)
        if (nodeData) {
          const content = `<b>${nodeData.type}</b><br>${
            nodeData.sentiment ? `Sentiment: ${nodeData.sentiment}` : ''
          }`
          setTooltip({
            visible: true,
            content,
            x: event.clientX,
            y: event.clientY,
          })
        }
      })

      network.on('blurNode', () => {
        setTooltip({ visible: false, content: '', x: 0, y: 0 })
      })

      network.on('afterDrawing', () => {
        if (!isRendered) {
          setIsRendered(true)
          if (onGraphReady) onGraphReady(true)
        }
      })

      return () => {
        if (network) {
          network.destroy()
        }
      }
    }, [
      data,
      theme,
      physicsOptions,
      styleOptions.nodeShapes,
      styleOptions.nodeColors,
      setSelectedNode,
      setTooltip,
      isRendered,
      onGraphReady,
    ])

    return (
      <div className="relative h-full w-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-skin-bg-accent bg-opacity-50 z-10 rounded-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-skin-btn-primary"></div>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    )
  }
)

export default GraphVisualization