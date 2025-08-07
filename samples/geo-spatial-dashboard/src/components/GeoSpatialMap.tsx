import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RegionalStat } from '@/types';
import { useEffect } from 'react';

const regionCoordinates: { [key: string]: [number, number] } = {
  "서울특별시": [37.5665, 126.9780],
  "부산광역시": [35.1796, 129.0756],
  "대구광역시": [35.8714, 128.6014],
  "인천광역시": [37.4563, 126.7052],
  "광주광역시": [35.1595, 126.8526],
  "대전광역시": [36.3504, 127.3845],
  "울산광역시": [35.5384, 129.3114],
  "경기도": [37.4138, 127.5183],
  "강원도": [37.8228, 128.1555],
  "충청북도": [36.6357, 127.4912],
  "충청남도": [36.5184, 126.8000],
  "전라북도": [35.7175, 127.1530],
  "전라남도": [34.8161, 126.4629],
  "경상북도": [36.4919, 128.8889],
  "경상남도": [35.4606, 128.2132],
  "제주특별자치도": [33.4996, 126.5312],
};

const getSalesCategory = (sales: number) => {
  if (sales > 60000000) return 'High';
  if (sales > 30000000) return 'Medium';
  return 'Low';
};

const createCustomIcon = (sales: number) => {
  const category = getSalesCategory(sales);
  const color = category === 'High' ? '#2563eb' : category === 'Medium' ? '#60a5fa' : '#bfdbfe';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative group">
        <div class="w-8 h-8 rounded-full border-4 border-white shadow-lg transition-transform duration-300 group-hover:scale-125" style="background-color: ${color};"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const MapController = ({ data }: { data: RegionalStat[] }) => {
  const map = useMap();
  useEffect(() => {
    if (data.length > 0) {
      const bounds = L.latLngBounds(data.map(stat => regionCoordinates[stat.region]).filter(Boolean) as L.LatLngExpression[]);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [data, map]);
  return null;
};

const Legend = () => (
  <div className="absolute bottom-4 left-4 z-[1000] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-100">
    <h4 className="font-semibold text-gray-800 mb-2">매출 규모</h4>
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
        <span className="text-sm text-gray-600">높음 (&gt;60M)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
        <span className="text-sm text-gray-600">중간 (30M-60M)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-blue-200 rounded-full"></div>
        <span className="text-sm text-gray-600">낮음 (&lt;30M)</span>
      </div>
    </div>
  </div>
);

export const GeoSpatialMap = ({ data }: { data: RegionalStat[] }) => {
  return (
    <div className="w-full h-[600px] lg:h-[700px] bg-white rounded-xl shadow-soft p-4 hover:shadow-lg transition-shadow duration-300">
      <div className="h-full w-full rounded-lg overflow-hidden relative">
        <MapContainer 
          center={[36.5, 127.5]}
          zoom={7} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapController data={data} />
          {data.map((stat) => {
            const position = regionCoordinates[stat.region];
            if (!position) return null;
            return (
              <Marker key={stat.region} position={position} icon={createCustomIcon(stat.total_sales)}>
                <Popup className="custom-popup">
                  <div className="p-4 min-w-[220px]">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{stat.region}</h3>
                    <div className="space-y-1.5">
                      <p className="text-sm text-gray-600 flex justify-between">
                        <span className="font-medium">총 매출:</span> 
                        <span>₩{stat.total_sales.toLocaleString()}</span>
                      </p>
                      <p className="text-sm text-gray-600 flex justify-between">
                        <span className="font-medium">고객 수:</span> 
                        <span>{stat.customer_count.toLocaleString()}</span>
                      </p>
                      <p className="text-sm text-gray-600 flex justify-between">
                        <span className="font-medium">평균 주문액:</span> 
                        <span>₩{Math.round(stat.avg_order_value).toLocaleString()}</span>
                      </p>
                      <p className="text-sm text-gray-600 flex justify-between">
                        <span className="font-medium">인기 카테고리:</span> 
                        <span className="font-semibold text-primary-600">{stat.top_category}</span>
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          <Legend />
        </MapContainer>
      </div>
    </div>
  );
};
