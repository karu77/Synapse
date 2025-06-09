import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
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

const GraphVisualization = forwardRef(
  (
    { data, isLoading, setTooltip, setSelectedNode, setSelectedEdge, physicsOptions, styleOptions, onGraphReady },
    ref
  ) => {
    const containerRef = useRef(null)
    const networkInstance = useRef(null)
    const { theme } = useTheme()

    // Use refs for callbacks to prevent re-triggering useEffect
    const onGraphReadyRef = useRef(onGraphReady)
    useEffect(() => {
      onGraphReadyRef.current = onGraphReady
    }, [onGraphReady])

    const dataRef = useRef(data)
    useEffect(() => {
      dataRef.current = data
    }, [data])

    // Initialize network
    useEffect(() => {
      if (containerRef.current) {
        const options = getOptions()
        const network = new Network(containerRef.current, {}, options)
        networkInstance.current = network

        network.on('click', (event) => {
          if (event.nodes.length > 0) {
            const nodeId = event.nodes[0]
            const node = dataRef.current.nodes.find((n) => n.id === nodeId)
            setSelectedNode(node)
            setSelectedEdge(null)
          } else if (event.edges.length > 0) {
            const edgeId = event.edges[0]
            const edge = dataRef.current.edges.find((e) => e.id === edgeId)
            if (edge) {
              setSelectedEdge(edge)
              setSelectedNode(null)
            }
          } else {
            setSelectedNode(null)
            setSelectedEdge(null)
          }
        })

        network.on('hoverNode', ({ node, event }) => {
          const nodeData = dataRef.current.nodes.find((n) => n.id === node)
          if (nodeData) {
            const content = `<b>${nodeData.type}</b><br>${
              nodeData.sentiment ? `Sentiment: ${nodeData.sentiment}` : ''
            }`
            setTooltip({
              visible: true,
              content,
              x: event.pointer.DOM.x,
              y: event.pointer.DOM.y,
            })
          }
        })

        network.on('hoverEdge', ({ edge, event }) => {
          const edgeData = dataRef.current.edges.find((e) => e.id === edge)
          if (edgeData) {
            const content = `<b>${edgeData.label}</b><br>${
              edgeData.sentiment ? `Sentiment: ${edgeData.sentiment}` : ''
            }`
            setTooltip({
              visible: true,
              content,
              x: event.pointer.DOM.x,
              y: event.pointer.DOM.y,
            })
          }
        })

        network.on('blurNode', () => {
          setTooltip({ visible: false, content: '', x: 0, y: 0 })
        })

        network.on('blurEdge', () => {
          setTooltip({ visible: false, content: '', x: 0, y: 0 })
        })

        network.on('afterDrawing', () => {
          onGraphReadyRef.current(true)
        })

        return () => {
          if (networkInstance.current) {
            networkInstance.current.destroy()
            networkInstance.current = null
          }
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Run only once

    const getOptions = () => ({
      autoResize: true,
      height: '100%',
      width: '100%',
      nodes: {
        size: 25,
        borderWidth: 3,
        borderWidthSelected: 6,
        font: {
          size: 14,
          face: 'Inter',
          color: '#ffffff',
        },
        shadow: false,
      },
      edges: {
        width: 2,
        font: {
          size: 12,
          color: theme === 'light' ? '#475569' : '#94a3b8',
          strokeWidth: 4,
          strokeColor: theme === 'light' ? '#f1f5f9' : '#0f172a',
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
        solver: 'barnesHut',
        barnesHut: {
          ...physicsOptions,
          centralGravity: 0.1,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
      },
      layout: {
        improvedLayout: true,
      },
    })

    // Update options when theme or physics change
    useEffect(() => {
      if (networkInstance.current) {
        networkInstance.current.setOptions(getOptions())
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme, physicsOptions, styleOptions])

    // Update data
    useEffect(() => {
      if (networkInstance.current) {
        onGraphReadyRef.current(false)
        const highlightColor = '#8b5cf6' // Use theme's primary button color for consistency

        const nodesWithStyling = data.nodes.map((node) => {
          const shape = styleOptions.nodeShapes[node.type] || 'dot'
          const color = getNodeColor(node.type, theme)

          return {
            ...node,
            shape: shape,
            color: {
              border: color,
              background: color,
              highlight: {
                border: highlightColor,
                background: color,
              },
              hover: {
                border: highlightColor,
                background: color,
              },
            },
            font: {
              color: shape === 'dot' || shape === 'circle' ? '#ffffff' : theme === 'light' ? '#1e293b' : '#f1f5f9',
            },
            size: node.type === 'PERSON' ? 30 : 25,
          }
        })

        const visEdges = data.edges.map((edge) => ({
          id: edge.id,
          from: edge.source,
          to: edge.target,
          label: edge.label,
          color: getEdgeColor(edge.sentiment),
        }))

        networkInstance.current.setData({ nodes: nodesWithStyling, edges: visEdges })
      }
    }, [data, theme, styleOptions])

    // Helper to trigger file download
    const triggerDownload = (blob, fileName) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    useImperativeHandle(ref, () => ({
      downloadGraph: () => {
        if (networkInstance.current) {
          const rootStyle = getComputedStyle(document.documentElement)
          const bgColor = rootStyle.getPropertyValue('--color-bg').trim() || '#ffffff'

          const originalCanvas = networkInstance.current.canvas.getContext('2d').canvas
          const scaleFactor = 8 // Increased scale factor for higher resolution
          const newCanvas = document.createElement('canvas')
          const ctx = newCanvas.getContext('2d')

          newCanvas.width = originalCanvas.width * scaleFactor
          newCanvas.height = originalCanvas.height * scaleFactor

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
          networkInstance.current.body.nodeIndices.length === 0
        ) {
          console.warn('SVG export cancelled: Network not ready or no nodes to export.')
          return
        }

        const network = networkInstance.current
        const renderedNodes = network.body.nodes // Use the internal, rendered nodes for accuracy
        const edges = network.body.data.edges.get()
        const nodePositions = network.getPositions()
        const boundingBox = network.getBoundingBox()

        // Get theme colors from CSS variables for perfect theme matching
        const rootStyle = getComputedStyle(document.documentElement)
        const bgColor = rootStyle.getPropertyValue('--color-bg').trim()
        const defaultTextColor = rootStyle.getPropertyValue('--color-text').trim()
        const textMutedColor = rootStyle.getPropertyValue('--color-text-muted').trim()

        const padding = 50
        const width = boundingBox.right - boundingBox.left + 2 * padding
        const height = boundingBox.bottom - boundingBox.top + 2 * padding
        const viewBox = `${boundingBox.left - padding} ${boundingBox.top - padding} ${width} ${height}`

        const svgDefs = `<defs><marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>`

        let edgePaths = '<g>'
        edges.forEach((edge) => {
          const fromPos = nodePositions[edge.from]
          const toPos = nodePositions[edge.to]
          if (!fromPos || !toPos) return

          const toNode = renderedNodes[edge.to]
          if (!toNode) return

          const toNodeSize = toNode.shape.size + toNode.shape.borderWidth

          const edgeColor = edge.color?.color || getEdgeColor(edge.sentiment)
          const dx = toPos.x - fromPos.x
          const dy = toPos.y - fromPos.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist === 0) return

          const arrowOffset = 5 // Add a small gap between arrow and node shape
          const newToX = toPos.x - (dx / dist) * (toNodeSize + arrowOffset)
          const newToY = toPos.y - (dy / dist) * (toNodeSize + arrowOffset)

          edgePaths += `<line x1="${fromPos.x}" y1="${fromPos.y}" x2="${newToX}" y2="${newToY}" stroke="${edgeColor}" stroke-width="2" marker-end="url(#arrowhead)" color="${edgeColor}" />`

          if (edge.label) {
            const midX = (fromPos.x + newToX) / 2
            const midY = (fromPos.y + newToY) / 2
            edgePaths += `<text x="${midX}" y="${midY}" font-family="Inter, sans-serif" font-size="12" fill="${textMutedColor}" text-anchor="middle" dominant-baseline="central" style="paint-order: stroke; stroke: ${bgColor}; stroke-width: 4px; stroke-linecap: butt; stroke-linejoin: miter;">${escapeXml(
              edge.label
            )}</text>`
          }
        })
        edgePaths += '</g>'

        let nodeElements = '<g>'
        Object.values(renderedNodes).forEach((node) => {
          const pos = nodePositions[node.id]
          if (!pos) return

          const color = node.options.color.background
          const shape = node.shape.name
          const nodeSize = node.shape.size
          const label = escapeXml(node.options.label)
          const labelColor = node.options.font.color || defaultTextColor

          if (shape === 'dot' || shape === 'circle') {
            nodeElements += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeSize}" fill="${color}" />`
            nodeElements += `<text x="${pos.x}" y="${pos.y}" font-family="Inter, sans-serif" font-size="14" fill="${labelColor}" text-anchor="middle" dominant-baseline="central">${label}</text>`
          } else {
            const width = nodeSize * 2
            const height = nodeSize * 2
            const x = pos.x - nodeSize
            const y = pos.y - nodeSize

            if (shape === 'box' || shape === 'square') {
              nodeElements += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" rx="3" />`
            } else if (shape === 'diamond') {
              nodeElements += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" transform="rotate(45, ${pos.x}, ${pos.y})" />`
            } else {
              // Fallback for star, triangle, etc.
              nodeElements += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeSize}" fill="${color}" />`
            }
            nodeElements += `<text x="${pos.x}" y="${
              pos.y + nodeSize + 8
            }" font-family="Inter, sans-serif" font-size="14" fill="${labelColor}" text-anchor="middle" dominant-baseline="hanging">${label}</text>`
          }
        })
        nodeElements += '</g>'

        const svgString = `
<svg width="${Math.round(width)}" height="${Math.round(
          height
        )}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" style="font-family: Inter, sans-serif;">
  <rect x="${viewBox.split(' ')[0]}" y="${
          viewBox.split(' ')[1]
        }" width="${width}" height="${height}" fill="${bgColor}" />
  ${svgDefs}
  ${edgePaths}
  ${nodeElements}
</svg>`
        const blob = new Blob([svgString], { type: 'image/svg+xml' })
        triggerDownload(blob, 'synapse-graph.svg')
      },
      downloadJSON: () => {
        const jsonString = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        triggerDownload(blob, 'synapse-graph.json')
      },
      downloadNodesCSV: () => {
        const headers = ['id', 'label', 'type', 'sentiment']
        let csvContent = headers.join(',') + '\r\n'
        data.nodes.forEach((node) => {
          const row = headers.map((header) => `"${node[header] || ''}"`)
          csvContent += row.join(',') + '\r\n'
        })
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        triggerDownload(blob, 'synapse-nodes.csv')
      },
      downloadEdgesCSV: () => {
        const headers = ['source', 'target', 'label', 'sentiment']
        let csvContent = headers.join(',') + '\r\n'
        data.edges.forEach((edge) => {
          const row = headers.map((header) => `"${edge[header] || ''}"`)
          csvContent += row.join(',') + '\r\n'
        })
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        triggerDownload(blob, 'synapse-edges.csv')
      },
    }))

    return (
      <div className="h-full w-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-white text-lg font-semibold">Generating...</div>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    )
  }
)

export default GraphVisualization