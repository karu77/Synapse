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
    { data, isLoading, setTooltip, setSelectedNode, physicsOptions, styleOptions, onGraphReady },
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
          } else {
            setSelectedNode(null)
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

        network.on('blurNode', () => {
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
            size: node.type === 'PERSON' ? 30 : 25,
          }
        })

        const visEdges = data.edges.map((edge) => ({
          from: edge.source,
          to: edge.target,
          label: edge.label,
          color: getEdgeColor(edge.sentiment),
        }))

        networkInstance.current.setData({ nodes: nodesWithStyling, edges: visEdges })
      }
    }, [data, theme, styleOptions])

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

        let svgDefs = `<defs>
<marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
</marker></defs>`

        let edgePaths = '<g>'
        edges.forEach((edge) => {
          const fromPos = nodePositions[edge.source]
          const toPos = nodePositions[edge.target]
          if (!fromPos || !toPos) return

          const toNode = nodes.find((n) => n.id === edge.target)
          if (!toNode) return

          const toNodeShape = styleOptions.nodeShapes[toNode.type] || 'dot'
          const toNodeSize = (toNode.type === 'PERSON' ? 30 : 25) + 3 // size + border

          const edgeColor = getEdgeColor(edge.sentiment)
          const dx = toPos.x - fromPos.x
          const dy = toPos.y - fromPos.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist === 0) return // Avoid division by zero for overlapping nodes

          const newToX = toPos.x - (dx / dist) * (toNodeSize + 5) // +5 for padding
          const newToY = toPos.y - (dy / dist) * (toNodeSize + 5)

          edgePaths += `<line x1="${fromPos.x}" y1="${fromPos.y}" x2="${newToX}" y2="${newToY}" stroke="${edgeColor}" stroke-width="2" marker-end="url(#arrowhead)" color="${edgeColor}" />`

          const midX = (fromPos.x + toPos.x) / 2
          const midY = (fromPos.y + toPos.y) / 2
          const edgeLabelColor = theme === 'light' ? '#111827' : '#E0E0E0'
          edgePaths += `<text x="${midX}" y="${midY}" font-family="Inter" font-size="12" fill="${edgeLabelColor}" text-anchor="middle" dominant-baseline="central" style="paint-order: stroke; stroke: ${bgColor}; stroke-width: 4px; stroke-linecap: butt; stroke-linejoin: miter;">${escapeXml(
            edge.label
          )}</text>`
        })
        edgePaths += '</g>'

        let nodeElements = '<g>'
        nodes.forEach((node) => {
          const pos = nodePositions[node.id]
          if (!pos) return

          const color = getNodeColor(node.type, theme)
          const shape = styleOptions.nodeShapes[node.type] || 'dot'
          const nodeSize = node.type === 'PERSON' ? 30 : 25
          const borderWidth = 3

          if (shape === 'dot' || shape === 'circle') {
            nodeElements += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeSize}" fill="${color}" stroke="${color}" stroke-width="${borderWidth}" />`
          } else if (shape === 'box' || shape === 'square') {
            nodeElements += `<rect x="${pos.x - nodeSize}" y="${
              pos.y - nodeSize
            }" width="${nodeSize * 2}" height="${
              nodeSize * 2
            }" fill="${color}" stroke="${color}" stroke-width="${borderWidth}" />`
          } else if (shape === 'diamond') {
            nodeElements += `<rect x="${pos.x - nodeSize}" y="${
              pos.y - nodeSize
            }" width="${nodeSize * 2}" height="${
              nodeSize * 2
            }" fill="${color}" stroke="${color}" stroke-width="${borderWidth}" transform="rotate(45, ${
              pos.x
            }, ${pos.y})" />`
          } else {
            // Default to circle for other shapes like star, triangle etc. for simplicity in SVG.
            nodeElements += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeSize}" fill="${color}" stroke="${color}" stroke-width="${borderWidth}" />`
          }
          const labelColor = shape === 'dot' || shape === 'circle' ? '#ffffff' : textColor
          nodeElements += `<text x="${pos.x}" y="${
            pos.y + (shape === 'dot' || shape === 'circle' ? 5 : nodeSize + 14)
          }" font-family="Inter" font-size="14" fill="${labelColor}" text-anchor="middle">${escapeXml(
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