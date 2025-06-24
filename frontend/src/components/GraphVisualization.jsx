import React, { useEffect, useRef, useState, forwardRef, useMemo, useImperativeHandle } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { useTheme } from '../contexts/ThemeContext';
import { getNodeColor } from '../utils/colors';

// #region Helper Functions

const getNodeShape = (node, diagramType) => {
  if (diagramType === 'flowchart') {
    switch (node.type) {
      case 'START_END':
        return { shape: 'ellipse' };
      case 'PROCESS':
      case 'SUBROUTINE':
      case 'MANUAL_LOOP':
        return { shape: 'box' };
      case 'DOCUMENT':
        return { shape: 'box' }; // vis.js has no native document shape
      case 'DECISION':
      case 'SORT':
        return { shape: 'diamond' };
      case 'INPUT_OUTPUT':
        return { shape: 'box' }; // vis.js has no native parallelogram
      case 'CONNECTOR':
        return { shape: 'circle' };
      case 'DELAY':
        return { shape: 'box' }; // vis.js has no native delay shape
      case 'MERGE':
        return { shape: 'triangleDown' };
      case 'COLLATE':
      case 'LOOP_LIMIT':
        return { shape: 'hexagon' };
      case 'DATA_STORAGE':
      case 'DATABASE':
        return { shape: 'database' };
      case 'DISPLAY':
        return { shape: 'ellipse' };
      case 'OFF_PAGE':
        return { shape: 'triangle' };
      default:
        return { shape: 'box' };
    }
  }
  return { shape: 'dot' };
};

const getNodeFont = (node, diagramType, theme) => {
  const font = {
    color: theme === 'dark' ? '#E2E8F0' : '#2D3748',
    size: 14,
    face: 'Inter, sans-serif',
    multi: 'html',
    bold: {
      size: 16,
      vadjust: -2,
    },
  };

  if (diagramType === 'mindmap') {
    font.size = 18;
    font.face = 'Poppins';
  }

  if (diagramType === 'flowchart') {
    font.face = 'Roboto Mono';
  }

  return { font };
};

const getNodeSize = (node, diagramType) => {
  if (node.size) return node.size;
  if (diagramType === 'knowledge-graph') return 30;
  if (diagramType === 'mindmap') return 40;
  return 25;
};

const getNodeStyle = (node, diagramType, theme) => {
  const style = {
    ...getNodeShape(node, diagramType),
    color: getNodeColor(node, diagramType, theme),
    ...getNodeFont(node, diagramType, theme),
    size: getNodeSize(node, diagramType),
    borderWidth: diagramType === 'knowledge-graph' ? 0 : 2,
    borderWidthSelected: 4,
    shadow: {
      enabled: diagramType !== 'knowledge-graph',
      color: 'rgba(0,0,0,0.2)',
      size: 10,
      x: 5,
      y: 5,
    },
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    labelHighlightBold: true,
  };

  if (diagramType === 'mindmap') {
    style.shape = 'box';
    style.shapeProperties = { borderRadius: 6 };
  }

  if (node.style) {
    Object.assign(style, node.style);
  }

  return style;
};

const getEdgeStyle = (edge, diagramType, theme) => {
  let color = theme === 'dark' ? '#555' : '#ccc';
  let width = 1.5;
  let arrowsEnabled = false;
  let fontColor = theme === 'dark' ? '#CBD5E0' : '#4A5568';
  const upperCaseLabel = edge.label?.toUpperCase();

  if (diagramType === 'knowledge-graph') {
    if (upperCaseLabel === 'PIONEERED_BY') {
      color = '#2ECC71';
      width = 2;
      arrowsEnabled = true;
    } else if (['DEVELOPED', 'HAS'].includes(upperCaseLabel)) {
      arrowsEnabled = true;
    }
  }

  // Improve text visibility for mind maps
  if (diagramType === 'mindmap') {
    // Use brighter, more visible colors for mind map edge text
    fontColor = theme === 'dark' ? '#F1F5F9' : '#1E293B'; // Much brighter in dark, darker in light
    color = theme === 'dark' ? '#64748B' : '#94A3B8'; // Better edge line visibility
    width = 2; // Slightly thicker lines for mind maps
  }

  const style = {
    width: width,
    color: { color: color, highlight: theme === 'dark' ? '#E2E8F0' : '#2D3748', hover: theme === 'dark' ? '#E2E8F0' : '#2D3748', inherit: false },
    arrows: { to: { enabled: arrowsEnabled, scaleFactor: 0.8, type: 'arrow' } },
    smooth: { enabled: true, type: 'dynamic', roundness: 0.5 },
    font: { 
      color: fontColor, 
      size: diagramType === 'mindmap' ? 14 : 12, // Larger font for mind maps
      face: diagramType === 'mindmap' ? 'Inter, sans-serif' : 'monospace', 
      align: 'horizontal',
      strokeWidth: diagramType === 'mindmap' && theme === 'dark' ? 2 : 0, // Add stroke for better visibility in dark theme
      strokeColor: diagramType === 'mindmap' && theme === 'dark' ? '#1E293B' : 'transparent'
    },
    labelHighlightBold: true,
  };

  if (diagramType === 'flowchart') {
    style.smooth = { enabled: true, type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.7 };
    style.arrows.to.enabled = true;
  }

  if (diagramType === 'mindmap') {
    style.smooth = { enabled: true, type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.9 };
  }

  if (edge.style) {
    Object.assign(style, edge.style);
  }

  return style;
};

const getLayoutOptions = (type, flowchartDirection) => {
  switch (type) {
    case 'flowchart':
      return {
        hierarchical: {
          enabled: true,
          direction: flowchartDirection === 'TB' ? 'UD' : 'LR',
          sortMethod: 'directed',
          nodeSpacing: 80,
          levelSeparation: 200,
          treeSpacing: 200,
        },
      };
    case 'mindmap':
      return {
        hierarchical: {
          enabled: true,
          direction: 'LR',
          sortMethod: 'directed',
          nodeSpacing: 180,
          levelSeparation: 350,
          treeSpacing: 250,
        },
      };
    default: // knowledge-graph
      return {
        randomSeed: 2,
        improvedLayout: true,
        clusterThreshold: 150,
        hierarchical: {
          enabled: false,
        },
      };
  }
};

const getPhysicsOptions = (type) => {
  switch (type) {
    case 'flowchart':
      return {
        enabled: true,
        solver: 'hierarchicalRepulsion',
        hierarchicalRepulsion: {
          centralGravity: 0.1,
          springLength: 200,
          springConstant: 0.2,
          nodeDistance: 150,
          damping: 0.15,
        },
      };
    case 'mindmap':
      return {
        enabled: false,
      };
    default: // knowledge-graph
      return {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -100,
          centralGravity: 0.005,
          springLength: 250,
          springConstant: 0.1,
          damping: 0.4,
          avoidOverlap: 0.5,
        },
      };
  }
};

// #endregion

const GraphVisualization = forwardRef(
  (
    { data, setTooltip, setSelectedNode, setSelectedEdge, onGraphReady, diagramType = 'knowledge-graph', onNodeContextMenu, onEdgeContextMenu, onBackgroundContextMenu, flowchartDirection = 'TB', isProcessing },
    ref
  ) => {
    const containerRef = useRef(null);
    const networkInstance = useRef(null);
    const { theme } = useTheme();
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, node: null, edge: null });
    const [isLoading, setIsLoading] = useState(false);
    const [networkStats, setNetworkStats] = useState({ nodes: 0, edges: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isInteracting, setIsInteracting] = useState(false);

    const normalizedData = useMemo(() => {
      if (!data || !data.nodes) return { nodes: new DataSet([]), edges: new DataSet([]) };

      const nodes = new DataSet(data.nodes.map(n => ({ ...n, ...getNodeStyle(n, diagramType, theme) })));
      const edges = new DataSet(data.edges.map(e => ({ ...e, from: e.source, to: e.target, ...getEdgeStyle(e, diagramType, theme) })));

      return { nodes, edges };
    }, [data, diagramType, theme]);

    // Context Menu Right-Click Handler
    useEffect(() => {
        const handleContextMenuEvent = (event) => {
            event.preventDefault();
            const rect = containerRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const nodeId = networkInstance.current?.getNodeAt({ x, y });
            const edgeId = networkInstance.current?.getEdgeAt({ x, y });

            setContextMenu({
                visible: true,
                x: x,
                y: y,
                node: nodeId ? normalizedData.nodes.get(nodeId) : null,
                edge: edgeId ? normalizedData.edges.get(edgeId) : null,
            });
        };

        const container = containerRef.current;
        container.addEventListener('contextmenu', handleContextMenuEvent);

        return () => {
            container.removeEventListener('contextmenu', handleContextMenuEvent);
        };
    }, [normalizedData, onNodeContextMenu, onEdgeContextMenu, onBackgroundContextMenu]);

    // Close Context Menu
    useEffect(() => {
      const handleClickOutside = () => setContextMenu({ visible: false, x: 0, y: 0, node: null, edge: null });
      if (contextMenu.visible) {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      }
    }, [contextMenu.visible]);

    // Main Network Effect
    useEffect(() => {
      if (!containerRef.current) return;

      const options = {
        physics: getPhysicsOptions(diagramType),
        layout: getLayoutOptions(diagramType, flowchartDirection),
        interaction: {
          hover: true,
          tooltipDelay: 200,
          navigationButtons: true,
          keyboard: true,
        },
        nodes: {
          chosen: {
            node: (values, id, selected, hovering) => {
              if (hovering) {
                values.size *= 1.1;
              }
            },
          },
        },
        edges: {
          chosen: {
            edge: (values, id, selected, hovering) => {
              if (hovering) {
                values.width *= 1.5;
              }
            },
          },
        },
      };

      if (!networkInstance.current) {
        networkInstance.current = new Network(containerRef.current, normalizedData, options);

        networkInstance.current.on('click', ({ nodes, edges }) => {
          if (nodes.length > 0) {
            setSelectedNode(normalizedData.nodes.get(nodes[0]));
            setSelectedEdge(null);
          } else if (edges.length > 0) {
            setSelectedEdge(normalizedData.edges.get(edges[0]));
            setSelectedNode(null);
          } else {
            setSelectedNode(null);
            setSelectedEdge(null);
          }
        });

        networkInstance.current.on('hoverNode', ({ node, event }) => {
          const nodeData = normalizedData.nodes.get(node);
          const content = `<b>${nodeData.label}</b>`;
          setTooltip({ visible: true, content, x: event.pointer.DOM.x, y: event.pointer.DOM.y });
          containerRef.current.style.cursor = 'pointer';
        });

        networkInstance.current.on('blurNode', () => {
          setTooltip({ visible: false, content: '', x: 0, y: 0 });
          containerRef.current.style.cursor = 'default';
        });

        if (onGraphReady) {
          networkInstance.current.on('stabilized', () => onGraphReady(networkInstance.current));
        }

      } else {
        networkInstance.current.setOptions(options);
        networkInstance.current.setData(normalizedData);
      }

      const handleResize = () => networkInstance.current?.fit();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (networkInstance.current) {
          networkInstance.current.destroy();
          networkInstance.current = null;
        }
      };
    }, [normalizedData, diagramType, flowchartDirection, onGraphReady, setSelectedNode, setSelectedEdge, setTooltip]);

    useImperativeHandle(ref, () => ({
      fit: () => networkInstance.current?.fit(),
      getNetwork: () => networkInstance.current,
      downloadSVG: () => {
        const network = networkInstance.current;
        if (!network) {
          console.error('Network instance not available');
          alert('Download failed: Graph not ready.');
          return;
        }

        try {
          // Use a flag to ensure the download logic runs only once
          let downloadTriggered = false;

          const onAfterDrawing = () => {
            if (downloadTriggered) return;
            downloadTriggered = true;

            // Remove the listener immediately to prevent multiple triggers
            network.off('afterDrawing', onAfterDrawing);

            // Give the browser a moment to breathe before capturing
            setTimeout(() => {
              try {
                const svgData = network.getSVG();
                const blob = new Blob([svgData], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `synapse-${diagramType}-${new Date().toISOString().slice(0, 10)}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch (svgError) {
                console.error('SVG generation failed, falling back to PNG:', svgError);
                try {
                  const canvas = network.canvas.frame.canvas;
                  const dataURL = canvas.toDataURL('image/png');
                  const link = document.createElement('a');
                  link.href = dataURL;
                  link.download = `synapse-${diagramType}-${new Date().toISOString().slice(0, 10)}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  alert('SVG export failed. The diagram has been downloaded as a PNG image instead.');
                } catch (fallbackError) {
                  console.error('Fallback PNG download also failed:', fallbackError);
                  alert('Download failed for both SVG and PNG. Please check the console for errors.');
                }
              }
            }, 100); // 100ms delay for safety
          };

          // Attach the listener and then fit the network to the view
          network.on('afterDrawing', onAfterDrawing);
          network.fit({ animation: false });

        } catch (error) {
          console.error('An unexpected error occurred during the download process setup:', error);
          alert('An unexpected error occurred. Could not initiate download.');
        }
      },
      downloadJSON: () => {
        if (!data || (!data.nodes && !data.edges)) {
          console.error('No graph data available for download');
          return;
        }
        
        const graphData = {
          nodes: data.nodes || [],
          edges: data.edges || [],
          diagramType: diagramType,
          timestamp: new Date().toISOString(),
          metadata: {
            nodeCount: data.nodes?.length || 0,
            edgeCount: data.edges?.length || 0,
            diagramType: diagramType
          }
        };
        
        const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `synapse-${diagramType}-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      downloadNodesCSV: () => {
        if (!data?.nodes || data.nodes.length === 0) {
          console.error('No nodes available for download');
          return;
        }
        
        // Get all unique properties from all nodes
        const allKeys = new Set();
        data.nodes.forEach(node => {
          Object.keys(node).forEach(key => allKeys.add(key));
        });
        
        const headers = Array.from(allKeys).sort();
        const csvContent = [
          headers.join(','),
          ...data.nodes.map(node => 
            headers.map(header => {
              const value = node[header];
              if (value === null || value === undefined) return '';
              if (typeof value === 'object') return JSON.stringify(value);
              return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
          )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `synapse-nodes-${diagramType}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      downloadEdgesCSV: () => {
        if (!data?.edges || data.edges.length === 0) {
          console.error('No edges available for download');
          return;
        }
        
        // Get all unique properties from all edges
        const allKeys = new Set();
        data.edges.forEach(edge => {
          Object.keys(edge).forEach(key => allKeys.add(key));
        });
        
        const headers = Array.from(allKeys).sort();
        const csvContent = [
          headers.join(','),
          ...data.edges.map(edge => 
            headers.map(header => {
              const value = edge[header];
              if (value === null || value === undefined) return '';
              if (typeof value === 'object') return JSON.stringify(value);
              return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
          )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `synapse-edges-${diagramType}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }));

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} />
        {isProcessing && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1500,
              backdropFilter: 'blur(8px)',
            }}
            className="bg-skin-bg"
          >
            <div className="flex flex-col items-center justify-center space-y-8 p-10 rounded-3xl bg-skin-bg-accent/95 backdrop-blur-2xl border-2 border-skin-border/50 shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
              <div className="relative">
                <div className="animate-spin rounded-full h-24 w-24 border-4 border-skin-border/30 border-t-skin-accent shadow-2xl"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-24 w-24 border-2 border-skin-accent/40 opacity-30"></div>
                <div className="absolute inset-2 animate-pulse rounded-full h-20 w-20 bg-skin-accent/10"></div>
              </div>
              
              <div className="bg-skin-bg/80 backdrop-blur-xl rounded-2xl p-6 border border-skin-border/30 shadow-xl max-w-sm w-full">
                <div className="text-center space-y-3">
                  <div className="text-xl font-bold text-skin-text bg-gradient-to-r from-skin-text to-skin-accent bg-clip-text text-transparent">
                    Generating {diagramType === 'knowledge-graph' ? 'Knowledge Graph' : 
                              diagramType === 'mindmap' ? 'Mind Map' :
                              diagramType === 'flowchart' ? 'Flowchart' :
                              diagramType === 'sequence' ? 'Sequence Diagram' :
                              diagramType === 'er-diagram' ? 'ER Diagram' :
                              diagramType === 'timeline' ? 'Timeline' :
                              diagramType === 'swimlane' ? 'Swimlane Diagram' :
                              diagramType === 'state' ? 'State Diagram' :
                              diagramType === 'gantt' ? 'Gantt Chart' :
                              diagramType === 'venn' ? 'Venn Diagram' :
                              'Diagram'}...
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-skin-border to-transparent"></div>
                  <div className="text-sm text-skin-text-muted font-medium">
                    Please wait while we process your request
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <div className="w-3 h-3 bg-skin-accent rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-skin-accent rounded-full animate-bounce shadow-lg" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-skin-accent rounded-full animate-bounce shadow-lg" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        {contextMenu.visible && (
          <div
            style={{
              position: 'absolute',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 2000,
              backgroundColor: theme === 'dark' ? '#2D3748' : 'white',
              border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'} `,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '8px',
              minWidth: '150px',
            }}
          >
            {contextMenu.node && onNodeContextMenu && onNodeContextMenu(contextMenu.node, { x: contextMenu.x, y: contextMenu.y })}
            {contextMenu.edge && onEdgeContextMenu && onEdgeContextMenu(contextMenu.edge, { x: contextMenu.x, y: contextMenu.y })}
            {!contextMenu.node && !contextMenu.edge && onBackgroundContextMenu && onBackgroundContextMenu({ x: contextMenu.x, y: contextMenu.y })}
          </div>
        )}
      </div>
    );
  }
);

export default GraphVisualization;