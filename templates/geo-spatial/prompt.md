## Visualization Type: Geo-Spatial Analysis

### Overview
Create an interactive map-based visualization for displaying geographic data points, regions, and spatial relationships. The application should support various map layers, clustering, heatmaps, and location-based analytics.

### Required Components:

1. **InteractiveMap**: Main map component using React Leaflet
   - **Features**:
     - Multiple base layers (OpenStreetMap, satellite, terrain)
     - Marker clustering for performance with many points
     - Custom marker icons based on data attributes
     - Popup tooltips with data visualization
     - Zoom and pan controls
     - Fullscreen mode
   - **Implementation**:
     ```jsx
     <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
       <MarkerClusterGroup>
         {markers.map(marker => (
           <Marker position={marker.position} icon={customIcon}>
             <Popup>{marker.details}</Popup>
           </Marker>
         ))}
       </MarkerClusterGroup>
     </MapContainer>
     ```

2. **LocationSearch**: Search and filter locations
   - **Features**:
     - Autocomplete search with fuzzy matching
     - Filter by categories or attributes
     - Search within bounds
     - Recent searches history
   - **UI Elements**:
     - Search input with dropdown suggestions
     - Category filter chips
     - Clear and reset buttons

3. **MapControls**: Layer and view controls
   - **Features**:
     - Toggle between map types
     - Show/hide data layers
     - Export map as image/PDF
     - Reset to default view
     - Distance measurement tool
   - **Layout**:
     - Floating control panel
     - Collapsible sections
     - Touch-friendly buttons

4. **LocationDetails**: Information display for selected location
   - **Features**:
     - Detailed metrics display
     - Mini charts for time-series data
     - Comparison with nearby locations
     - Navigation/directions link
   - **Display Options**:
     - Popup on marker click
     - Sidebar panel
     - Modal dialog

5. **HeatmapLayer**: Density visualization
   - **Features**:
     - Configurable radius and blur
     - Custom color gradients
     - Intensity based on data values
     - Toggle on/off
   - **Configuration**:
     ```javascript
     const heatmapData = locations.map(loc => [
       loc.lat, 
       loc.lng, 
       loc.intensity || 1
     ]);
     ```

### Data Processing:

```javascript
const processGeoData = (db, filters = {}) => {
  // Basic location query
  let query = `
    SELECT 
      {{latColumn}} as lat,
      {{lngColumn}} as lng,
      {{nameColumn}} as name,
      {{categoryColumn}} as category,
      {{metricColumns}}
    FROM {{tableName}}
    WHERE {{latColumn}} IS NOT NULL 
      AND {{lngColumn}} IS NOT NULL
  `;
  
  // Add filters
  if (filters.category) {
    query += ` AND {{categoryColumn}} = '${filters.category}'`;
  }
  
  if (filters.bounds) {
    query += `
      AND {{latColumn}} BETWEEN ${filters.bounds.south} AND ${filters.bounds.north}
      AND {{lngColumn}} BETWEEN ${filters.bounds.west} AND ${filters.bounds.east}
    `;
  }
  
  const results = db.exec(query);
  
  return results[0]?.values.map(row => ({
    position: [row[0], row[1]],
    name: row[2],
    category: row[3],
    metrics: processMetrics(row.slice(4))
  })) || [];
};

// Calculate bounds for initial view
const calculateBounds = (locations) => {
  const lats = locations.map(l => l.position[0]);
  const lngs = locations.map(l => l.position[1]);
  
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ];
};

// Cluster nearby points
const clusterLocations = (locations, zoomLevel) => {
  // Implementation depends on clustering algorithm
  // Can use supercluster or custom clustering
  return clusteredLocations;
};
```

### Map Styling and Customization:

```javascript
// Custom marker icons based on category
const getMarkerIcon = (category, value) => {
  const iconOptions = {
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    className: `marker-${category}`
  };
  
  // Color based on value ranges
  if (value > threshold.high) {
    iconOptions.className += ' marker-high';
  } else if (value > threshold.medium) {
    iconOptions.className += ' marker-medium';
  } else {
    iconOptions.className += ' marker-low';
  }
  
  return L.divIcon(iconOptions);
};

// Heatmap gradient configuration
const heatmapGradient = {
  0.0: 'blue',
  0.5: 'lime',
  0.7: 'yellow',
  1.0: 'red'
};
```

### Performance Optimizations:

1. **Viewport-based Loading**:
   ```javascript
   const loadVisibleMarkers = (bounds, zoom) => {
     // Only query and render markers within current viewport
     const visibleMarkers = queryMarkersInBounds(bounds);
     
     // Adjust clustering based on zoom level
     if (zoom < 10) {
       return clusterMarkers(visibleMarkers);
     }
     return visibleMarkers;
   };
   ```

2. **Lazy Loading**:
   - Load detailed data only when marker is clicked
   - Implement virtual scrolling for location lists
   - Cache previously loaded data

3. **Canvas Rendering**:
   - Use canvas renderer for many markers
   - Implement custom canvas layers for heatmaps

### Responsive Design:

- **Mobile**: 
  - Full-screen map with bottom sheet for details
  - Touch gestures for zoom/pan
  - Simplified controls
  
- **Tablet**: 
  - Split view with map and details panel
  - Floating search bar
  
- **Desktop**: 
  - Full dashboard with sidebar
  - Advanced filtering options
  - Multi-panel layout

### Accessibility:

- Keyboard navigation for map controls
- Screen reader descriptions for locations
- High contrast mode for markers
- Alternative table view of data

### Export Features:

- Export map as PNG/PDF
- Export visible data as CSV
- Generate shareable link with current view
- Print-friendly layout