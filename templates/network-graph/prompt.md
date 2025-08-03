## Visualization Type: Network Graph

### Overview
Create an interactive network graph visualization to display relationships, connections, and network structures. Support various layout algorithms, node/edge styling, and network analysis features.

### Required Components:

1. **NetworkGraph**: Main force-directed graph component
   - **Layout Algorithms**:
     - Force-directed (default)
     - Hierarchical/Tree
     - Circular
     - Grid
     - Radial
   - **Features**:
     - Interactive nodes (drag, click, hover)
     - Zoom and pan controls
     - Node clustering/grouping
     - Edge bundling
     - Physics simulation controls
   - **Implementation**:
     ```jsx
     <ForceGraph2D
       ref={graphRef}
       graphData={graphData}
       nodeLabel="name"
       nodeAutoColorBy="group"
       nodeCanvasObject={(node, ctx, globalScale) => {
         // Custom node rendering
         const label = node.name;
         const fontSize = 12/globalScale;
         ctx.font = `${fontSize}px Sans-Serif`;
         ctx.textAlign = 'center';
         ctx.fillStyle = node.color;
         ctx.fillText(label, node.x, node.y);
       }}
       linkDirectionalArrowLength={6}
       onNodeClick={handleNodeClick}
       onNodeHover={handleNodeHover}
       onLinkClick={handleLinkClick}
     />
     ```

2. **NodePanel**: Node details and interaction panel
   - **Information Display**:
     - Node properties
     - Degree (in/out connections)
     - Centrality metrics
     - Connected nodes list
     - Shortest paths
   - **Actions**:
     - Highlight connections
     - Expand/collapse cluster
     - Filter by connection
     - Focus view on node

3. **GraphControls**: Graph manipulation controls
   - **Layout Controls**:
     - Layout algorithm selector
     - Force strength sliders
     - Node spacing adjustment
     - Animation speed
   - **Filter Options**:
     - Node type filters
     - Edge weight threshold
     - Degree filter
     - Search nodes
   - **View Options**:
     - Show/hide labels
     - Edge direction arrows
     - Node size mapping
     - Color schemes

4. **MiniMap**: Overview navigation
   - **Features**:
     - Entire graph overview
     - Current viewport indicator
     - Click to navigate
     - Highlighted regions

5. **GraphMetrics**: Network analysis metrics
   - **Metrics**:
     - Number of nodes/edges
     - Average degree
     - Network density
     - Clustering coefficient
     - Connected components
     - Diameter
   - **Node Metrics**:
     - Degree centrality
     - Betweenness centrality
     - Closeness centrality
     - PageRank

### Data Processing:

```javascript
const processNetworkData = (db, config) => {
  // Fetch edges
  const edgeQuery = `
    SELECT 
      {{sourceColumn}} as source,
      {{targetColumn}} as target,
      {{weightColumn}} as weight,
      {{typeColumn}} as type,
      {{attributeColumns}}
    FROM {{edgeTable}}
    ${config.filter ? `WHERE ${config.filter}` : ''}
  `;
  
  const edges = db.exec(edgeQuery);
  
  // Fetch nodes (if separate table)
  let nodes = [];
  if (config.hasNodeTable) {
    const nodeQuery = `
      SELECT 
        {{idColumn}} as id,
        {{nameColumn}} as name,
        {{groupColumn}} as group,
        {{sizeColumn}} as size,
        {{attributeColumns}}
      FROM {{nodeTable}}
    `;
    
    nodes = db.exec(nodeQuery);
  } else {
    // Extract nodes from edges
    nodes = extractNodesFromEdges(edges[0]?.values || []);
  }
  
  return buildGraphData(
    nodes[0]?.values || nodes,
    edges[0]?.values || []
  );
};

// Build graph data structure
const buildGraphData = (nodeData, edgeData) => {
  const nodeMap = new Map();
  
  // Process nodes
  nodeData.forEach(row => {
    const node = {
      id: row[0],
      name: row[1] || row[0],
      group: row[2] || 'default',
      size: row[3] || 1,
      attributes: row.slice(4)
    };
    nodeMap.set(node.id, node);
  });
  
  // Process edges and ensure all nodes exist
  const links = [];
  edgeData.forEach(row => {
    const [source, target, weight, type] = row;
    
    // Ensure nodes exist
    if (!nodeMap.has(source)) {
      nodeMap.set(source, { id: source, name: source, group: 'default' });
    }
    if (!nodeMap.has(target)) {
      nodeMap.set(target, { id: target, name: target, group: 'default' });
    }
    
    links.push({
      source,
      target,
      weight: weight || 1,
      type: type || 'default'
    });
  });
  
  return {
    nodes: Array.from(nodeMap.values()),
    links
  };
};

// Calculate network metrics
const calculateNetworkMetrics = (nodes, links) => {
  const metrics = {
    nodeCount: nodes.length,
    edgeCount: links.length,
    density: (2 * links.length) / (nodes.length * (nodes.length - 1)),
    avgDegree: (2 * links.length) / nodes.length
  };
  
  // Build adjacency list
  const adjacency = buildAdjacencyList(nodes, links);
  
  // Calculate centrality metrics
  nodes.forEach(node => {
    node.degree = adjacency[node.id]?.length || 0;
    node.betweenness = calculateBetweennessCentrality(node.id, nodes, adjacency);
    node.closeness = calculateClosenessCentrality(node.id, nodes, adjacency);
    node.pagerank = calculatePageRank(node.id, nodes, links);
  });
  
  // Find connected components
  metrics.components = findConnectedComponents(nodes, adjacency);
  metrics.largestComponent = Math.max(...metrics.components.map(c => c.length));
  
  // Calculate clustering coefficient
  metrics.clusteringCoefficient = calculateGlobalClusteringCoefficient(nodes, adjacency);
  
  return metrics;
};
```

### Layout Algorithms:

```javascript
// Force-directed layout configuration
const forceSimulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links)
    .id(d => d.id)
    .distance(d => 50 / (d.weight || 1))
    .strength(1))
  .force('charge', d3.forceManyBody()
    .strength(-300)
    .distanceMax(250))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide()
    .radius(d => d.size * 5))
  .on('tick', () => {
    updateNodePositions();
    updateLinkPositions();
  });

// Hierarchical layout
const hierarchicalLayout = (nodes, links) => {
  const stratify = d3.stratify()
    .id(d => d.id)
    .parentId(d => findParent(d, links));
  
  const root = stratify(nodes);
  const treeLayout = d3.tree()
    .size([width, height])
    .separation((a, b) => a.parent === b.parent ? 1 : 2);
  
  treeLayout(root);
  
  root.descendants().forEach(d => {
    d.data.x = d.x;
    d.data.y = d.y;
  });
};

// Circular layout
const circularLayout = (nodes, groups) => {
  const groupAngles = {};
  const angleStep = (2 * Math.PI) / groups.length;
  
  groups.forEach((group, i) => {
    groupAngles[group] = i * angleStep;
  });
  
  nodes.forEach(node => {
    const angle = groupAngles[node.group] + 
      (Math.random() - 0.5) * angleStep * 0.8;
    const radius = 200 + Math.random() * 50;
    
    node.x = width/2 + radius * Math.cos(angle);
    node.y = height/2 + radius * Math.sin(angle);
  });
};

// Radial layout based on centrality
const radialLayout = (nodes, centralNode) => {
  const distances = calculateShortestPaths(centralNode, nodes);
  const maxDistance = Math.max(...Object.values(distances));
  
  nodes.forEach(node => {
    const distance = distances[node.id] || maxDistance;
    const angle = Math.random() * 2 * Math.PI;
    const radius = (distance / maxDistance) * Math.min(width, height) / 2;
    
    node.x = width/2 + radius * Math.cos(angle);
    node.y = height/2 + radius * Math.sin(angle);
  });
};
```

### Interactive Features:

```javascript
// Node interaction handlers
const handleNodeClick = (node) => {
  setSelectedNode(node);
  
  // Highlight connected nodes
  const connectedNodes = getConnectedNodes(node);
  highlightNodes([node, ...connectedNodes]);
  
  // Update node panel
  updateNodePanel({
    node,
    neighbors: connectedNodes,
    metrics: calculateNodeMetrics(node),
    paths: findShortestPathsFrom(node)
  });
};

// Node hover effects
const handleNodeHover = (node) => {
  if (!node) {
    resetHighlight();
    return;
  }
  
  // Dim non-connected nodes
  const connected = new Set([node.id]);
  links.forEach(link => {
    if (link.source.id === node.id) connected.add(link.target.id);
    if (link.target.id === node.id) connected.add(link.source.id);
  });
  
  nodes.forEach(n => {
    n.opacity = connected.has(n.id) ? 1 : 0.2;
  });
  
  links.forEach(l => {
    l.opacity = (l.source.id === node.id || l.target.id === node.id) ? 1 : 0.1;
  });
  
  updateGraph();
};

// Search and filter
const searchNodes = (query) => {
  const matches = nodes.filter(node => 
    node.name.toLowerCase().includes(query.toLowerCase()) ||
    node.attributes.some(attr => 
      attr.toString().toLowerCase().includes(query.toLowerCase())
    )
  );
  
  if (matches.length > 0) {
    highlightNodes(matches);
    if (matches.length === 1) {
      centerOnNode(matches[0]);
    }
  }
  
  return matches;
};

// Dynamic filtering
const applyFilters = (filters) => {
  const visibleNodes = new Set();
  const visibleLinks = [];
  
  // Filter nodes
  nodes.forEach(node => {
    let visible = true;
    
    if (filters.nodeTypes.length > 0 && !filters.nodeTypes.includes(node.type)) {
      visible = false;
    }
    
    if (filters.minDegree && node.degree < filters.minDegree) {
      visible = false;
    }
    
    if (visible) {
      visibleNodes.add(node.id);
    }
  });
  
  // Filter links
  links.forEach(link => {
    if (visibleNodes.has(link.source.id) && visibleNodes.has(link.target.id)) {
      if (!filters.minWeight || link.weight >= filters.minWeight) {
        visibleLinks.push(link);
      }
    }
  });
  
  updateGraph({
    nodes: nodes.filter(n => visibleNodes.has(n.id)),
    links: visibleLinks
  });
};
```

### Network Analysis:

```javascript
// Community detection using Louvain algorithm
const detectCommunities = (nodes, links) => {
  const communities = louvain(nodes, links);
  
  // Assign community colors
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  nodes.forEach(node => {
    node.community = communities[node.id];
    node.color = colorScale(node.community);
  });
  
  return communities;
};

// Find shortest path between two nodes
const findShortestPath = (source, target, nodes, links) => {
  const adjacency = buildAdjacencyList(nodes, links);
  const distances = {};
  const previous = {};
  const unvisited = new Set(nodes.map(n => n.id));
  
  nodes.forEach(node => {
    distances[node.id] = Infinity;
  });
  distances[source.id] = 0;
  
  while (unvisited.size > 0) {
    let current = null;
    let minDistance = Infinity;
    
    unvisited.forEach(nodeId => {
      if (distances[nodeId] < minDistance) {
        current = nodeId;
        minDistance = distances[nodeId];
      }
    });
    
    if (current === null || current === target.id) break;
    
    unvisited.delete(current);
    
    adjacency[current]?.forEach(neighbor => {
      const alt = distances[current] + 1;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    });
  }
  
  // Reconstruct path
  const path = [];
  let current = target.id;
  while (current !== undefined) {
    path.unshift(current);
    current = previous[current];
  }
  
  return path;
};

// Calculate network robustness
const analyzeRobustness = (nodes, links) => {
  const originalComponents = findConnectedComponents(nodes, links);
  const results = [];
  
  // Test node removal impact
  nodes.forEach(node => {
    const remainingNodes = nodes.filter(n => n.id !== node.id);
    const remainingLinks = links.filter(l => 
      l.source.id !== node.id && l.target.id !== node.id
    );
    
    const newComponents = findConnectedComponents(remainingNodes, remainingLinks);
    
    results.push({
      node: node,
      impact: newComponents.length - originalComponents.length,
      largestComponentChange: Math.max(...newComponents.map(c => c.length)) - 
                              Math.max(...originalComponents.map(c => c.length))
    });
  });
  
  return results.sort((a, b) => b.impact - a.impact);
};
```

### Export Features:

```javascript
// Export graph as image
const exportAsImage = (format = 'png') => {
  const canvas = graphRef.current.renderer.domElement;
  
  if (format === 'png') {
    canvas.toBlob(blob => {
      saveAs(blob, 'network-graph.png');
    });
  } else if (format === 'svg') {
    const svg = convertCanvasToSVG(canvas);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    saveAs(blob, 'network-graph.svg');
  }
};

// Export graph data
const exportGraphData = (format) => {
  switch (format) {
    case 'json':
      const json = JSON.stringify({ nodes, links }, null, 2);
      saveAs(new Blob([json], { type: 'application/json' }), 'graph.json');
      break;
      
    case 'graphml':
      const graphml = generateGraphML(nodes, links);
      saveAs(new Blob([graphml], { type: 'text/xml' }), 'graph.graphml');
      break;
      
    case 'gexf':
      const gexf = generateGEXF(nodes, links);
      saveAs(new Blob([gexf], { type: 'text/xml' }), 'graph.gexf');
      break;
  }
};

// Generate network analysis report
const generateNetworkReport = () => {
  const metrics = calculateNetworkMetrics(nodes, links);
  const communities = detectCommunities(nodes, links);
  const robustness = analyzeRobustness(nodes, links);
  
  const report = {
    overview: {
      nodes: metrics.nodeCount,
      edges: metrics.edgeCount,
      density: metrics.density.toFixed(3),
      avgDegree: metrics.avgDegree.toFixed(2),
      components: metrics.components.length,
      communities: Object.keys(communities).length
    },
    topNodes: {
      byDegree: [...nodes].sort((a, b) => b.degree - a.degree).slice(0, 10),
      byBetweenness: [...nodes].sort((a, b) => b.betweenness - a.betweenness).slice(0, 10),
      byPageRank: [...nodes].sort((a, b) => b.pagerank - a.pagerank).slice(0, 10)
    },
    vulnerabilities: robustness.slice(0, 5),
    insights: generateNetworkInsights(metrics, communities, robustness)
  };
  
  return report;
};
```

### Responsive Design:

- **Mobile**: 
  - Simplified graph with fewer nodes visible
  - Touch gestures for navigation
  - Collapsible info panels
  - Basic metrics only
  
- **Tablet**: 
  - Medium complexity graphs
  - Touch-friendly node selection
  - Side panel for details
  
- **Desktop**: 
  - Full graph complexity
  - Multiple panels
  - Advanced analysis tools
  - Keyboard shortcuts