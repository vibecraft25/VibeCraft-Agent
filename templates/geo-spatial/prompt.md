## Visualization Type: Geo-Spatial Analysis

### Overview
Create a simple interactive map visualization showing geographic data points. Focus on basic functionality: displaying markers on a map with popups showing data details.

### Core Requirements:
- Display an interactive map using Leaflet
- Show data points as markers
- Click markers to see data details
- Basic zoom and pan controls

### Implementation:
1. Use OpenStreetMap as the base layer
2. Convert location data (region names or coordinates) to map markers
3. Show data values in popup when marker is clicked
4. Center map on data points automatically

### IMPORTANT:
- Keep it simple - just basic map with markers
- No clustering, heatmaps, or advanced features
- Use only leaflet and react-leaflet (no additional map packages)
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
<MapContainer 
  center={[36.5, 127.5]} // Center of Korea
  zoom={7} 
  style={{ height: '100%', width: '100%' }}
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; OpenStreetMap contributors'
  />
  {/* Add markers here */}
</MapContainer>
```

### CSS Import:
Remember to import Leaflet CSS in your main.tsx or App.tsx:
```javascript
import 'leaflet/dist/leaflet.css';
```