## Visualization Type: Geo-Spatial Analysis

### Overview
Create a beautiful, modern interactive map visualization showing geographic data points with polished UI/UX. Display markers on a map with elegant popups and smooth interactions.

### Core Requirements:
- Display an interactive map using Leaflet with custom styling
- Show data points as custom-styled markers
- Click markers to see beautifully designed data popups
- Smooth zoom and pan controls with animations
- Responsive design that works on all devices

### UI/UX Design Requirements:
1. **Map Container Styling**
   - Rounded corners (rounded-xl) with shadow effect
   - Proper height management for different viewports
   - Loading state with skeleton while map initializes

2. **Custom Marker Design**
   - Use divIcon for custom HTML markers
   - Apply primary color scheme (blue-500/600)
   - Add hover effects with scale transform
   - Include data values directly on markers when possible

3. **Popup Styling**
   - Modern card design with rounded corners
   - Consistent padding and typography
   - Use shadows for depth
   - Include relevant icons and data visualization

4. **Control Panel**
   - Filter controls in a floating card
   - Search functionality with modern input styling
   - Legend with color-coded categories

### Implementation:
1. Use OpenStreetMap as the base layer with custom attribution styling
2. Convert location data (region names or coordinates) to styled markers
3. Show detailed data in beautifully designed popups
4. Center and fit bounds automatically based on data points
5. Add smooth transitions for all map interactions

### IMPORTANT:
- Keep it performant - use marker clustering for large datasets
- Ensure mobile responsiveness
- Use only leaflet and react-leaflet (no additional complex packages)
- If data has Korean region names, map them to coordinates

### Sample Coordinate Mapping for Korean Regions:
```javascript
const regionCoordinates = {
  "서울": [37.5665, 126.9780],
  "부산": [35.1796, 129.0756],
  "대구": [35.8714, 128.6014],
  "인천": [37.4563, 126.7052],
  "광주": [35.1595, 126.8526],
  "대전": [36.3504, 127.3845],
  "울산": [35.5384, 129.3114],
  "경기": [37.4138, 127.5183],
  "강원": [37.8228, 128.1555],
  "충북": [36.6357, 127.4912],
  "충남": [36.5184, 126.8000],
  "전북": [35.7175, 127.1530],
  "전남": [34.8161, 126.4629],
  "경북": [36.4919, 128.8889],
  "경남": [35.4606, 128.2132],
  "제주": [33.4996, 126.5312]
};
```

### Map Container Setup:
```jsx
// Wrap in a styled container
<div className="w-full h-[600px] bg-white rounded-xl shadow-soft p-4 hover:shadow-lg transition-shadow duration-300">
  <div className="h-full w-full rounded-lg overflow-hidden">
    <MapContainer 
      center={[36.5, 127.5]} // Center of Korea
      zoom={7} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* Add styled markers here */}
    </MapContainer>
  </div>
</div>
```

### Custom Marker Example:
```jsx
const createCustomIcon = (value: number, color: string = '#3b82f6') => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative">
        <div class="absolute -top-10 -left-4 bg-white rounded-lg shadow-lg px-3 py-1 min-w-[60px] text-center transform hover:scale-110 transition-transform duration-200">
          <div class="text-xs font-semibold text-gray-700">${value.toLocaleString()}</div>
        </div>
        <div class="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg transform hover:scale-110 transition-transform duration-200"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};
```

### Styled Popup Example:
```jsx
<Popup className="custom-popup">
  <div className="p-4 min-w-[200px]">
    <h3 className="font-bold text-lg text-gray-800 mb-2">{location.name}</h3>
    <div className="space-y-1">
      <p className="text-sm text-gray-600">
        <span className="font-medium">Total Sales:</span> ₩{sales.toLocaleString()}
      </p>
      <p className="text-sm text-gray-600">
        <span className="font-medium">Transactions:</span> {count}
      </p>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-200">
      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
        View Details →
      </button>
    </div>
  </div>
</Popup>
```

### CSS Import and Custom Styles:
In index.html, add Leaflet CSS in <head>:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

Add custom styles in your component:
const customStyles = `
  .leaflet-popup-content-wrapper {
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .leaflet-popup-tip {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .custom-div-icon {
    background: transparent;
    border: none;
  }
  
  .leaflet-container {
    font-family: inherit;
  }
`;
```

### Additional UI Components:

#### Loading State:
```jsx
const MapSkeleton = () => (
  <div className="w-full h-[600px] bg-gray-100 rounded-xl animate-pulse">
    <div className="h-full w-full rounded-lg bg-gray-200"></div>
  </div>
);
```

#### Map Controls Card:
```jsx
<div className="absolute top-4 right-4 z-[1000] bg-white rounded-xl shadow-lg p-4 min-w-[200px]">
  <h3 className="font-semibold text-gray-800 mb-3">Map Controls</h3>
  <div className="space-y-2">
    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm">
      Show All Regions
    </button>
    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm">
      Reset View
    </button>
  </div>
</div>
```

#### Legend Component:
```jsx
<div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl shadow-lg p-4">
  <h4 className="font-semibold text-gray-800 mb-2">Sales Volume</h4>
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
      <span className="text-sm text-gray-600">High (>1M)</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
      <span className="text-sm text-gray-600">Medium (500K-1M)</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-blue-200 rounded-full"></div>
      <span className="text-sm text-gray-600">Low (<500K)</span>
    </div>
  </div>
</div>
```