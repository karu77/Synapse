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
  } else if (diagramType?.startsWith('mindmap')) {
    // Differentiate mindmap node shapes based on type
    switch (node.type) {
      case 'MAIN_TOPIC':
        return { shape: 'box', shapeProperties: { borderRadius: 10 } }; // Larger, rounded box for central
      case 'TOPIC':
        return { shape: 'ellipse' }; // Oval for main branches
      case 'SUBTOPIC':
        return { shape: 'circle' }; // Circle for sub-branches
      case 'CONCEPT':
        return { shape: 'diamond' }; // Diamond for concepts in concept maps
      case 'DATE':
      case 'EVENT':
      case 'MILESTONE':
      case 'PERIOD':
        return { shape: 'box', shapeProperties: { borderRadius: 4 } }; // Small box for timeline items
      case 'CHILD_TOPIC':
        return { shape: 'box', shapeProperties: { borderRadius: 6 } }; // Default for radial child topics
      case 'PERSON':
      case 'ORG':
      case 'LOCATION':
      case 'PRODUCT':
      case 'ROLE':
      case 'FUNCTION':
        return { shape: 'box', shapeProperties: { borderRadius: 6 } }; // Default box for organizational/other specific types
      default:
        return { shape: 'box', shapeProperties: { borderRadius: 6 } }; // Fallback mindmap shape
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

  if (diagramType?.startsWith('mindmap')) {
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
  if (diagramType?.startsWith('mindmap')) return 40;
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
  if (diagramType?.startsWith('mindmap')) {
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
      size: diagramType?.startsWith('mindmap') ? 14 : 12, // Larger font for mind maps
      face: diagramType?.startsWith('mindmap') ? 'Inter, sans-serif' : 'monospace', 
      align: 'horizontal',
      strokeWidth: diagramType?.startsWith('mindmap') && theme === 'dark' ? 2 : 0, // Add stroke for better visibility in dark theme
      strokeColor: diagramType?.startsWith('mindmap') && theme === 'dark' ? '#1E293B' : 'transparent'
    },
    labelHighlightBold: true,
  };

  if (diagramType === 'flowchart') {
    style.smooth = { enabled: true, type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.7 };
    style.arrows.to.enabled = true;
  }

  if (diagramType?.startsWith('mindmap')) {
    style.smooth = { enabled: true, type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.9 };
  }

  if (edge.style) {
    Object.assign(style, edge.style);
  }

  return style;
};

const getLayoutOptions = (type, flowchartDirection) => {
  // Radial maps are physics-based, not hierarchical
  if (type === 'mindmap-radial') {
    return {
      randomSeed: 2,
      improvedLayout: true,
      clusterThreshold: 150,
      hierarchical: {
        enabled: false,
      },
    }
  }

  const diagramFamily = type?.startsWith('mindmap') ? 'mindmap' : type;
  switch (diagramFamily) {
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
  // Radial maps need physics to arrange themselves
  if (type === 'mindmap-radial') {
    return {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -120,
        centralGravity: 0.01,
        springLength: 300,
        springConstant: 0.1,
        damping: 0.4,
        avoidOverlap: 0.9,
      },
    }
  }

  const diagramFamily = type?.startsWith('mindmap') ? 'mindmap' : type;
  switch (diagramFamily) {
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

        networkInstance.current.on('hoverNode', ({ node, pointer }) => {
          if (pointer) {
            const nodeData = normalizedData.nodes.get(node);
            const content = `<b>${nodeData.label}</b>`;
            setTooltip({ visible: true, content, x: pointer.DOM.x, y: pointer.DOM.y });
            containerRef.current.style.cursor = 'pointer';
          }
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
      },
      exportAsSVG: () => {
        const network = networkInstance.current;
        if (!network) {
          alert('Network not ready');
          return;
        }
        const positions = network.getPositions();
        const nodes = network.body.data.nodes.get();
        const edges = network.body.data.edges.get();
        // Use the diagramType from props, not from network.body.data
        // This ensures subtypes are respected
        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        Object.values(positions).forEach(pos => {
          if (!pos) return;
          minX = Math.min(minX, pos.x);
          minY = Math.min(minY, pos.y);
          maxX = Math.max(maxX, pos.x);
          maxY = Math.max(maxY, pos.y);
        });
        // Padding for labels/arrows
        const pad = 80;
        const width = Math.ceil(maxX - minX + 2 * pad);
        const height = Math.ceil(maxY - minY + 2 * pad);
        // SVG header
        let svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='${minX-pad} ${minY-pad} ${width} ${height}'>`;
        // --- Draw Edges ---
        edges.forEach(edge => {
          const from = positions[edge.from];
          const to = positions[edge.to];
          if (!from || !to) return;
          const style = getEdgeStyle(edge, diagramType, theme);
          // Edge path: straight or Bezier
          let path = '';
          if (style.smooth && style.smooth.enabled && style.smooth.type === 'cubicBezier') {
            // Calculate control points for Bezier
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            let cx1, cy1, cx2, cy2;
            if (style.smooth.forceDirection === 'vertical') {
              cx1 = from.x;
              cy1 = from.y + dy * style.smooth.roundness;
              cx2 = to.x;
              cy2 = to.y - dy * style.smooth.roundness;
            } else { // horizontal or dynamic
              cx1 = from.x + dx * style.smooth.roundness;
              cy1 = from.y;
              cx2 = to.x - dx * style.smooth.roundness;
              cy2 = to.y;
            }
            path = `<path d='M${from.x},${from.y} C${cx1},${cy1} ${cx2},${cy2} ${to.x},${to.y}' stroke='${style.color.color}' stroke-width='${style.width}' fill='none' marker-end='${style.arrows.to.enabled ? 'url(#arrowhead)' : ''}' />`;
          } else {
            path = `<line x1='${from.x}' y1='${from.y}' x2='${to.x}' y2='${to.y}' stroke='${style.color.color}' stroke-width='${style.width}' marker-end='${style.arrows.to.enabled ? 'url(#arrowhead)' : ''}' />`;
          }
          svg += path;
          // Edge label (centered)
          if (edge.label) {
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            svg += `<text x='${mx}' y='${my - 8}' text-anchor='middle' font-size='${style.font.size}' fill='${style.font.color}' font-family='${style.font.face}'>${edge.label}</text>`;
          }
        });
        // Arrowhead marker
        svg += `<defs><marker id='arrowhead' markerWidth='10' markerHeight='7' refX='10' refY='3.5' orient='auto' markerUnits='strokeWidth'><polygon points='0 0, 10 3.5, 0 7' fill='#333' /></marker></defs>`;
        // --- Draw Nodes ---
        nodes.forEach(node => {
          const pos = positions[node.id];
          if (!pos) return;
          const style = getNodeStyle(node, diagramType, theme);
          let nodeSVG = '';
          // Node shape
          switch (style.shape) {
            case 'ellipse':
              nodeSVG = `<ellipse cx='${pos.x}' cy='${pos.y}' rx='${style.size*1.1}' ry='${style.size*0.8}' fill='${style.color}' stroke='#333' stroke-width='${style.borderWidth}' />`;
              break;
            case 'box':
              const r = style.shapeProperties?.borderRadius || 6;
              nodeSVG = `<rect x='${pos.x-style.size}' y='${pos.y-style.size*0.7}' width='${style.size*2}' height='${style.size*1.4}' rx='${r}' fill='${style.color}' stroke='#333' stroke-width='${style.borderWidth}' />`;
              break;
            case 'diamond':
              nodeSVG = `<polygon points='${pos.x},${pos.y-style.size} ${pos.x+style.size},${pos.y} ${pos.x},${pos.y+style.size} ${pos.x-style.size},${pos.y}' fill='${style.color}' stroke='#333' stroke-width='${style.borderWidth}' />`;
              break;
            case 'circle':
              nodeSVG = `<circle cx='${pos.x}' cy='${pos.y}' r='${style.size}' fill='${style.color}' stroke='#333' stroke-width='${style.borderWidth}' />`;
              break;
            case 'triangle':
              nodeSVG = `<polygon points='${pos.x},${pos.y-style.size} ${pos.x+style.size},${pos.y+style.size} ${pos.x-style.size},${pos.y+style.size}' fill='${style.color}' stroke='#333' stroke-width='${style.borderWidth}' />`;
              break;
            case 'triangleDown':
              nodeSVG = `<polygon points='${pos.x-style.size},${pos.y-style.size} ${pos.x+style.size},${pos.y-style.size} ${pos.x},${pos.y+style.size}' fill='${style.color}' stroke='#333' stroke-width='${style.borderWidth}' />`;
              break;
            case 'hexagon':
              const hex = Array.from({length:6},(_,i)=>{
                const angle = Math.PI/3*i;
                return `${pos.x+style.size*Math.cos(angle)},${pos.y+style.size*Math.sin(angle)}`;
              }).join(' ');
              nodeSVG = `<polygon points='${hex}' fill='${style.color}' stroke='#333' stroke-width='${style.borderWidth}' />`;
              break;
            case 'database':
              nodeSVG = `<ellipse cx='${pos.x}' cy='${pos.y}' rx='${style.size*1.1}' ry='${style.size*0.7}' fill='${style.color}' stroke='#333' stroke-width='${style.borderWidth}' />`;
              nodeSVG += `<ellipse cx='${pos.x}' cy='${pos.y+style.size*0.7}' rx='${style.size*1.1}' ry='${style.size*0.2}' fill='rgba(0,0,0,0.08)' />`;
              break;
            default:
              nodeSVG = `<circle cx='${pos.x}' cy='${pos.y}' r='${style.size}' fill='${style.color}' stroke='#333' stroke-width='${style.borderWidth}' />`;
          }
          // Node label
          if (node.label) {
            svg += nodeSVG + `<text x='${pos.x}' y='${pos.y+5}' text-anchor='middle' font-size='${style.font.size}' fill='${style.font.color}' font-family='${style.font.face}'>${node.label}</text>`;
          } else {
            svg += nodeSVG;
          }
        });
        svg += '</svg>';
        // Download SVG
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'graph-export.svg';
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