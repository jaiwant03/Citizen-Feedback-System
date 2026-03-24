import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom colored markers using marker API
const createColoredIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  Pending: createColoredIcon('red'),
  'In Progress': createColoredIcon('blue'),
  Resolved: createColoredIcon('green')
};

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/reports');
        // Only keep reports with valid GPS location
        const validReports = res.data.filter(r => r.location && r.location.latitude && r.location.longitude);
        setReports(validReports);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-100px)] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 z-0">
      <MapContainer center={[13.0827, 80.2707]} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {reports.map((report) => (
          <Marker 
            key={report._id} 
            position={[report.location.latitude, report.location.longitude]}
            icon={icons[report.status] || icons['Pending']}
          >
            <Popup className="rounded-xl overflow-hidden">
              <div className="font-sans min-w-[200px]">
                <h3 className="font-bold text-lg capitalize mb-1 text-gray-900">{report.issueType}</h3>
                <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                    report.status === 'Pending' ? 'bg-red-100 text-red-700' : 
                    report.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {report.status}
                  </span>
                  {report.isEmergency && <span className="bg-red-600 text-white px-2 py-1 text-xs font-bold rounded-md">EMERGENCY</span>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
