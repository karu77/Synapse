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
        // Initialize with empty data to prevent undefined errors
        const emptyData = { nodes: [], edges: [] }
        const network = new Network(containerRef.current, emptyData, options)
        networkInstance.current = network

        network.on('click', (event) => {
          if (event.nodes.length > 0) {
            const nodeId = event.nodes[0]
            const node = (dataRef.current?.nodes ?? []).find((n) => n.id === nodeId)
            setSelectedNode(node)
            setSelectedEdge(null)
          } else if (event.edges.length > 0) {
            const edgeId = event.edges[0]
            const edge = (dataRef.current?.edges ?? []).find((e) => e.id === edgeId)
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
          const nodeData = (dataRef.current?.nodes ?? []).find((n) => n.id === node)
          if (nodeData && event.pointer && event.pointer.DOM) {
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
          const edgeData = (dataRef.current?.edges ?? []).find((e) => e.id === edge)
          if (edgeData && event.pointer && event.pointer.DOM) {
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

        // Use the 'stabilized' event to reliably determine when the graph is ready.
        // This fires once the physics simulation has settled down.
        network.on('stabilized', () => {
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
      // Defensive: Only proceed if networkInstance, data, and DOM container are ready
      if (!networkInstance.current) return;
      if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) return;
      if (!networkInstance.current.body || !networkInstance.current.body.container) return;

      onGraphReadyRef.current(false)
      const highlightColor = '#8b5cf6' // Use theme's primary button color for consistency

      const nodesWithStyling = (data?.nodes ?? []).map((node) => ({
        ...node,
        shape: styleOptions.nodeShapes[node.type] || 'dot',
        color: {
          border: getNodeColor(node.type, theme),
          background: getNodeColor(node.type, theme),
          highlight: {
            border: highlightColor,
            background: getNodeColor(node.type, theme),
          },
          hover: {
            border: highlightColor,
            background: getNodeColor(node.type, theme),
          },
        },
        font: {
          color: (node.shape === 'dot' || node.shape === 'circle') ? '#ffffff' : theme === 'light' ? '#1e293b' : '#f1f5f9',
        },
        size: node.type === 'PERSON' ? 30 : 25,
      }))

      const visEdges = (data?.edges ?? []).map((edge) => ({
        ...edge,
        id: edge.id || edge._id || edge.uuid, // ensure id is preserved from original data
        from: edge.source,
        to: edge.target,
        label: edge.label,
        color: getEdgeColor(edge.sentiment),
      }))

      networkInstance.current.setData({ nodes: nodesWithStyling, edges: visEdges })

      return () => {
        // Clean up event listeners if needed
        if (networkInstance.current && networkInstance.current.off) {
          networkInstance.current.off('selectEdge');
          networkInstance.current.off('selectNode');
        }
      };
    }, [data, theme, styleOptions, setSelectedNode, setSelectedEdge])

    // Robust selectEdge and selectNode event handlers
    useEffect(() => {
      if (!networkInstance.current) return;
      const network = networkInstance.current;

      network.on('selectEdge', function (params) {
        if (params.edges && params.edges.length > 0) {
          const edgeId = params.edges[0];
          const edge = (data?.edges ?? []).find(e => e.id === edgeId);
          console.log('selectEdge event:', { edgeId, edge }); // Debug log
          setSelectedEdge(edge);
          setSelectedNode(null);
        }
      });

      network.on('selectNode', function (params) {
        if (params.nodes && params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = (data?.nodes ?? []).find(n => n.id === nodeId);
          setSelectedNode(node);
          setSelectedEdge(null);
        }
      });

    }, [data, setSelectedNode, setSelectedEdge]);

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

    const downloadHighResImage = (format, quality) => {
      if (networkInstance.current) {
        const mimeType = `image/${format}`
        const fileExtension = format
        const fileName = `synapse-graph-high-resolution.${fileExtension}`

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

        const dataURL = newCanvas.toDataURL(mimeType, quality)
        const link = document.createElement('a')
        link.href = dataURL
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }

    useImperativeHandle(ref, () => ({
      downloadPNG: () => downloadHighResImage('png'),
      downloadWebP: () => downloadHighResImage('webp', 0.9),
      downloadJSON: () => {
        const jsonString = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        triggerDownload(blob, 'synapse-graph.json')
      },
      downloadNodesCSV: () => {
        const headers = ['id', 'label', 'type', 'sentiment']
        let csvContent = headers.join(',') + '\r\n'
        (data?.nodes ?? []).forEach((node) => {
          const row = headers.map((header) => `"${node[header] || ''}"`)
          csvContent += row.join(',') + '\r\n'
        })
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        triggerDownload(blob, 'synapse-nodes.csv')
      },
      downloadEdgesCSV: () => {
        const headers = ['source', 'target', 'label', 'sentiment']
        let csvContent = headers.join(',') + '\r\n'
        (data?.edges ?? []).forEach((edge) => {
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