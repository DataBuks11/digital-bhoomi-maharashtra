import React, { useEffect, useRef, useState } from 'react';
import { LandParcel, OwnershipRecord } from '../types';
import { 
  Map as MapIcon, 
  Layers, 
  Maximize2, 
  Ruler, 
  Compass, 
  FileText, 
  CreditCard, 
  QrCode,
  ShieldAlert,
  Info,
  CheckCircle2,
  Navigation,
  Eye,
  Radio,
  RotateCw,
  Box,
  Sliders,
  Sparkles,
  LocateFixed,
  MapPin
} from 'lucide-react';
import L from 'leaflet';
import { ActiveTab } from '../components/layout/Sidebar';
import { DroneDigitalTwin3D } from '../components/map/DroneDigitalTwin3D';

interface InteractiveLandMapViewProps {
  parcels: LandParcel[];
  ownerships: OwnershipRecord[];
  onNavigate: (tab: ActiveTab, params?: any) => void;
}

export type MapLayerType = 'osm' | 'satellite' | 'hybrid' | 'dark';

interface NagpurSection {
  id: string;
  name: string;
  marathi: string;
  lat: number;
  lng: number;
  zoom: number;
  parcelGat?: string;
}

const NAGPUR_SECTIONS: NagpurSection[] = [
  { id: 'all-nagpur', name: 'Nagpur District Grid', marathi: 'सर्व नागपूर विभाग', lat: 21.1150, lng: 79.0600, zoom: 12 },
  { id: 'besa', name: 'Besa (Ring Road)', marathi: 'बेसा (रिंग रोड)', lat: 21.0820, lng: 79.0850, zoom: 16, parcelGat: '77/2' },
  { id: 'besa-pipla', name: 'Besa - Pipla Road', marathi: 'बेसा - पिपळा रोड', lat: 21.0872, lng: 79.0910, zoom: 16, parcelGat: '89/1' },
  { id: 'manish-nagar', name: 'Manish Nagar', marathi: 'मनीष नगर (सोमलवाडा)', lat: 21.1010, lng: 79.0740, zoom: 16, parcelGat: '104/A' },
  { id: 'mihan', name: 'MIHAN SEZ / Khapri', marathi: 'मिहान विशेष आर्थिक क्षेत्र', lat: 21.0380, lng: 79.0410, zoom: 15, parcelGat: '188/SEZ' },
  { id: 'hingna', name: 'Hingna MIDC', marathi: 'हिंगणा औद्योगिक वसाहत', lat: 21.1045, lng: 78.9805, zoom: 15, parcelGat: '340' },
  { id: 'civil-lines', name: 'Civil Lines', marathi: 'सिव्हिल लाईन्स (धरमपेठ)', lat: 21.1535, lng: 79.0685, zoom: 16, parcelGat: 'CTS-1842' },
  { id: 'sitabuldi', name: 'Sitabuldi / Zero Mile', marathi: 'सीताबर्डी (झिरो माईल)', lat: 21.1460, lng: 79.0825, zoom: 17, parcelGat: 'CTS-412' },
  { id: 'wadi', name: 'Wadi (Amravati Rd)', marathi: 'वाडी - अमरावती महामार्ग', lat: 21.1475, lng: 78.9940, zoom: 15, parcelGat: '215/3' },
];

export const InteractiveLandMapView: React.FC<InteractiveLandMapViewProps> = ({
  parcels,
  ownerships,
  onNavigate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const polygonsGroupRef = useRef<L.LayerGroup | null>(null);
  const measureGroupRef = useRef<L.LayerGroup | null>(null);

  // State
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(() => {
    // Default to Nagpur Besa parcel if available, else first parcel
    const nagpurDefault = parcels.find(p => p.district === 'Nagpur' && p.village.includes('Besa'));
    return nagpurDefault || parcels[0] || null;
  });
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Nagpur');
  const [activeNagpurSection, setActiveNagpurSection] = useState<string>('besa');
  
  // Layer & 3D Controls
  const [mapLayerType, setMapLayerType] = useState<MapLayerType>('satellite');
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [pitch, setPitch] = useState<number>(45); // 0 to 60 deg
  const [bearing, setBearing] = useState<number>(-10); // -180 to 180 deg
  const [showDroneTwin, setShowDroneTwin] = useState<boolean>(false);

  // Measurement Tool State
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [measuredAreaSqm, setMeasuredAreaSqm] = useState<number | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on Nagpur (Besa / Manish Nagar area)
      const map = L.map(mapContainerRef.current, {
        center: [21.0820, 79.0850], // Nagpur Besa
        zoom: 15,
        zoomControl: true,
      });

      polygonsGroupRef.current = L.layerGroup().addTo(map);
      measureGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer dynamically based on mapLayerType
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (mapLayerType === 'osm') {
      baseTileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Digital Bhoomi Maharashtra',
        maxZoom: 19,
      }).addTo(map);
    } else if (mapLayerType === 'satellite') {
      // High-Resolution ESRI World Imagery
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
        }
      ).addTo(map);
    } else if (mapLayerType === 'hybrid') {
      // ESRI Satellite + Overlay Reference Roads and City Labels
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 19,
        }
      ).addTo(map);

      labelsLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
        }
      ).addTo(map);
    } else if (mapLayerType === 'dark') {
      // CartoDB Dark Matter GIS mode
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 19,
        }
      ).addTo(map);
    }
  }, [mapLayerType]);

  // Handle Measurement mode map clicks
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!measureMode) return;
      const newPoints = [...measurePoints, e.latlng];
      setMeasurePoints(newPoints);

      if (measureGroupRef.current) {
        measureGroupRef.current.clearLayers();
        
        newPoints.forEach((pt, i) => {
          L.circleMarker(pt, { radius: 5, color: '#dc2626', fillOpacity: 0.9 })
            .bindTooltip(`M${i+1}`, { permanent: true, direction: 'top' })
            .addTo(measureGroupRef.current!);
        });

        if (newPoints.length > 1) {
          L.polyline(newPoints, { color: '#dc2626', dashArray: '5, 5', weight: 2 })
            .addTo(measureGroupRef.current!);
        }

        if (newPoints.length >= 3) {
          L.polygon(newPoints, { color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.25 })
            .addTo(measureGroupRef.current!);

          // Shoelace formula on projected coordinates
          let area = 0;
          for (let i = 0; i < newPoints.length; i++) {
            const j = (i + 1) % newPoints.length;
            const p1 = map.project(newPoints[i]);
            const p2 = map.project(newPoints[j]);
            area += (p1.x * p2.y) - (p2.x * p1.y);
          }
          const metersPerPixel = 156543.03392 * Math.cos(newPoints[0].lat * Math.PI / 180) / Math.pow(2, map.getZoom());
          const approxM2 = Math.abs(area / 2) * Math.pow(metersPerPixel, 2);
          setMeasuredAreaSqm(Math.round(approxM2));
        }
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [measureMode, measurePoints]);

  // Render Cadastral Parcels onto Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = polygonsGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    parcels.forEach((parcel) => {
      if (selectedDistrict !== 'ALL' && parcel.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
        return;
      }

      if (parcel.boundaryCoordinates && parcel.boundaryCoordinates.length >= 3) {
        const latLngs: [number, number][] = parcel.boundaryCoordinates.map(c => [c.lat, c.lng]);

        // Status-based color palette
        let color = '#15803d'; // verified green
        let fillColor = '#22c55e';
        if (parcel.status === 'IN_DISPUTE') {
          color = '#b91c1c';
          fillColor = '#ef4444';
        } else if (parcel.status === 'MUTATION_IN_PROGRESS') {
          color = '#d97706';
          fillColor = '#f59e0b';
        } else if (parcel.landType === 'INDUSTRIAL' || parcel.landType === 'NON_AGRICULTURAL_COMMERCIAL') {
          color = '#7c3aed';
          fillColor = '#a855f7';
        }

        const isSelected = selectedParcel?.id === parcel.id;

        // Polygon boundary
        const polygon = L.polygon(latLngs, {
          color: isSelected ? (is3DMode ? '#38bdf8' : '#000000') : color,
          weight: isSelected ? 3.5 : 2,
          fillColor: isSelected ? (is3DMode ? '#0284c7' : fillColor) : fillColor,
          fillOpacity: isSelected ? 0.55 : (mapLayerType === 'satellite' || mapLayerType === 'hybrid' ? 0.35 : 0.25),
        });

        // Add 3D Survey Total Station Corner Marker Pins
        parcel.boundaryCoordinates.forEach((coord, i) => {
          const elevation = (312.4 + i * 0.4).toFixed(1);
          L.circleMarker([coord.lat, coord.lng], {
            radius: isSelected ? 4.5 : 3,
            color: isSelected ? '#38bdf8' : color,
            fillColor: '#ffffff',
            fillOpacity: 1,
            weight: 2,
          }).bindTooltip(
            is3DMode 
              ? `<strong>${coord.label || `P${i+1}`}</strong><br/><span style="font-family: monospace; color: #0284c7;">+${elevation}m MSL</span>` 
              : `${coord.label || `Marker ${i+1}`}`, 
            { direction: 'top' }
          ).addTo(group);
        });

        // Polygon tooltip
        polygon.bindTooltip(
          `<strong>Gat No. ${parcel.gatNumber}</strong> (${parcel.village})<br/>${parcel.areaHectare}H ${parcel.areaAre}R • ${parcel.totalAreaSqm.toLocaleString()} m²`,
          { sticky: true }
        );

        polygon.on('click', () => {
          setSelectedParcel(parcel);
        });

        polygon.addTo(group);
      }
    });
  }, [parcels, selectedParcel, selectedDistrict, is3DMode, mapLayerType]);

  // Jump to specific Nagpur section
  const handleSelectNagpurSection = (section: NagpurSection) => {
    setActiveNagpurSection(section.id);
    setSelectedDistrict('Nagpur');

    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([section.lat, section.lng], section.zoom, { duration: 1.2 });
    }

    if (section.parcelGat) {
      const match = parcels.find(p => p.district === 'Nagpur' && p.gatNumber === section.parcelGat);
      if (match) {
        setSelectedParcel(match);
      }
    }
  };

  // Center on Selected Parcel
  const flyToParcel = (parcel: LandParcel) => {
    setSelectedParcel(parcel);
    const map = mapInstanceRef.current;
    if (map && parcel.boundaryCoordinates && parcel.boundaryCoordinates.length > 0) {
      const bounds = L.latLngBounds(parcel.boundaryCoordinates.map(c => [c.lat, c.lng]));
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 17, duration: 1.2 });
    }
  };

  const clearMeasurement = () => {
    setMeasurePoints([]);
    setMeasuredAreaSqm(null);
    if (measureGroupRef.current) {
      measureGroupRef.current.clearLayers();
    }
  };

  const selectedOwners = selectedParcel 
    ? ownerships.filter(o => o.parcelId === selectedParcel.id)
    : [];

  return (
    <div className="space-y-4">
      
      {/* 3D Drone Digital Twin Modal */}
      {showDroneTwin && selectedParcel && (
        <DroneDigitalTwin3D
          parcel={selectedParcel}
          onClose={() => setShowDroneTwin(false)}
        />
      )}

      {/* Map Control Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-emerald-700" />
              Interactive Cadastral Land Map (महाराष्ट्र भू-नकाशा)
            </h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Nagpur Real Sections Integrated
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Cadastral plot boundaries, Total Station GPS coordinates, High-Res Satellite Orthophoto, and Live 3D Perspective Mode.
          </p>
        </div>

        {/* Toolbar: Layer Switcher & 3D Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Map Layer Mode Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setMapLayerType('osm')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapLayerType === 'osm' 
                  ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗺️ 2D Cadastre
            </button>
            <button
              onClick={() => setMapLayerType('satellite')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapLayerType === 'satellite' 
                  ? 'bg-white text-emerald-800 shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => setMapLayerType('hybrid')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapLayerType === 'hybrid' 
                  ? 'bg-white text-emerald-800 shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏙️ Hybrid
            </button>
            <button
              onClick={() => setMapLayerType('dark')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapLayerType === 'dark' 
                  ? 'bg-slate-900 text-cyan-400 shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌌 GIS Dark
            </button>
          </div>

          {/* 3D Perspective Toggle Button */}
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              is3DMode 
                ? 'bg-slate-900 text-cyan-400 border-cyan-500 shadow-sm ring-2 ring-cyan-500/20' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <Box className={`w-3.5 h-3.5 ${is3DMode ? 'animate-bounce text-cyan-400' : ''}`} />
            {is3DMode ? '3D Active' : 'Live 3D Map'}
          </button>

          {/* 3D Drone Digital Twin Launch Button */}
          {selectedParcel && (
            <button
              onClick={() => setShowDroneTwin(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all hover:shadow-sm"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>3D Drone Twin</span>
            </button>
          )}

          {/* District Dropdown Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Maharashtra Districts</option>
            <option value="Nagpur">Nagpur District (8 Zones)</option>
            <option value="Pune">Pune District</option>
            <option value="Nashik">Nashik District</option>
            <option value="Chhatrapati Sambhaji Nagar">Chhatrapati Sambhaji Nagar</option>
            <option value="Thane">Thane District</option>
          </select>

          {/* Measure Tool */}
          <button
            onClick={() => {
              setMeasureMode(!measureMode);
              if (measureMode) clearMeasurement();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              measureMode 
                ? 'bg-red-600 text-white border-red-700' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            {measureMode ? 'Exit' : 'Measure'}
          </button>

        </div>
      </div>

      {/* Nagpur Real Cadastral Sections Quick-Bar */}
      <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 flex-shrink-0 px-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>नागपूर विभाग (Nagpur Cadastral Zones):</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-1">
          {NAGPUR_SECTIONS.map((sec) => {
            const isActive = activeNagpurSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => handleSelectNagpurSection(sec)}
                className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 ${
                  isActive 
                    ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <span>{sec.name}</span>
                <span className="text-[10px] text-slate-400 opacity-80">({sec.marathi.split(' ')[0]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Perspective Controls Toolbar (visible when 3D mode is toggled) */}
      {is3DMode && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Box className="w-4 h-4" />
              <span>3D Camera Controls:</span>
            </div>

            {/* Pitch Slider */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="text-[11px] text-slate-400">Tilt (Pitch):</span>
              <input
                type="range"
                min="0"
                max="60"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-24 accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-cyan-300 font-bold text-[11px] w-7">{pitch}°</span>
            </div>

            {/* Bearing Rotation Slider */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <Compass 
                className="w-3.5 h-3.5 text-cyan-400 transition-transform duration-200" 
                style={{ transform: `rotate(${bearing}deg)` }} 
              />
              <span className="text-[11px] text-slate-400">Heading:</span>
              <input
                type="range"
                min="-180"
                max="180"
                value={bearing}
                onChange={(e) => setBearing(Number(e.target.value))}
                className="w-24 accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-cyan-300 font-bold text-[11px] w-9">{bearing}°</span>
            </div>
          </div>

          {/* Quick Pitch Presets */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 mr-1">Presets:</span>
            <button
              onClick={() => { setPitch(0); setBearing(0); }}
              className={`px-2 py-0.5 rounded transition-colors ${pitch === 0 ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            >
              Overhead (0°)
            </button>
            <button
              onClick={() => { setPitch(35); setBearing(-10); }}
              className={`px-2 py-0.5 rounded transition-colors ${pitch === 35 ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            >
              Oblique (35°)
            </button>
            <button
              onClick={() => { setPitch(50); setBearing(-25); }}
              className={`px-2 py-0.5 rounded transition-colors ${pitch === 50 ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            >
              Drone (50°)
            </button>
            <button
              onClick={() => { setPitch(60); setBearing(-40); }}
              className={`px-2 py-0.5 rounded transition-colors ${pitch === 60 ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            >
              Horizon (60°)
            </button>
          </div>
        </div>
      )}

      {/* Cadastral Measurement & Boundary Disclaimer */}
      <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Illustrative Demonstration Map (नमुना नकाशा सूचना):</strong> High-resolution satellite tiles and 3D geometric parcel extrusions displayed in this prototype are synthetic, approximate representations for prototype inspection. They do <em>not</em> constitute certified statutory cadastral map sheets (क किंवा टीपणी नकाशा) under the Maharashtra Land Revenue Code.
        </div>
      </div>

      {/* Measurement HUD banner */}
      {measureMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700" />
            <span>
              <strong>Measurement Tool Active:</strong> Click 3 or more points on the map to calculate approximate parcel boundary perimeter and area.
            </span>
          </div>
          {measuredAreaSqm !== null && (
            <div className="bg-amber-200/70 px-3 py-1 rounded font-bold text-amber-950 font-mono">
              Approx. Area: {measuredAreaSqm.toLocaleString()} m² ({(measuredAreaSqm / 101.17).toFixed(2)} Gunthas)
            </div>
          )}
        </div>
      )}

      {/* Map Layout: Left Sidebar + Right Leaflet Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left: Parcel List & Selected Detail */}
        <div className="space-y-4">
          
          {/* Active Parcel Inspector Card */}
          {selectedParcel ? (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                  Inspecting Cadastre
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  Gat {selectedParcel.gatNumber}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedParcel.village}, {selectedParcel.taluka}
                </h3>
                <div className="text-xs text-slate-500">{selectedParcel.district} District</div>
                <div className="text-[11px] font-mono text-emerald-700 font-semibold mt-0.5">
                  ULPIN: {selectedParcel.ulpin}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px] block">Total Area</span>
                  <span className="font-bold text-slate-800">{selectedParcel.areaHectare}H {selectedParcel.areaAre}R</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Square Meters</span>
                  <span className="font-bold text-slate-800">{selectedParcel.totalAreaSqm.toLocaleString()} m²</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium block mb-1">Registered Khatedar:</span>
                <div className="text-xs font-semibold text-slate-800">
                  {selectedOwners[0]?.ownerName || 'Government / Unassigned'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <button
                  onClick={() => onNavigate('records', { selectedParcelId: selectedParcel.id })}
                  className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Inspect Official 7/12
                </button>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onNavigate('cards', { selectedParcelId: selectedParcel.id })}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-slate-200"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Property Card
                  </button>
                  <button
                    onClick={() => onNavigate('surveys', { selectedParcelId: selectedParcel.id })}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-slate-200"
                  >
                    <Compass className="w-3.5 h-3.5" /> Field Survey
                  </button>
                </div>

                <button
                  onClick={() => setShowDroneTwin(true)}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-800"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  Launch 3D Drone Digital Twin
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              Select any parcel on the map or list to inspect details.
            </div>
          )}

          {/* Quick Parcel Selector List */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs max-h-72 overflow-y-auto space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
              <span>Parcels in View</span>
              <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {parcels.filter(p => selectedDistrict === 'ALL' || p.district.toLowerCase() === selectedDistrict.toLowerCase()).length}
              </span>
            </div>
            {parcels
              .filter(p => selectedDistrict === 'ALL' || p.district.toLowerCase() === selectedDistrict.toLowerCase())
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => flyToParcel(p)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedParcel?.id === p.id 
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold' 
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold truncate">Gat {p.gatNumber} - {p.village}</div>
                    <div className="text-[10px] text-slate-500">{p.district} ({p.areaHectare}H {p.areaAre}R)</div>
                  </div>
                  <Navigation className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-700 flex-shrink-0" />
                </button>
              ))}
          </div>

          {/* Map Legend */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-2">
            <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">
              Cadastral Layer Legend
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 flex-shrink-0"></span>
                <span>Verified Agricultural Land (7/12)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-purple-600 flex-shrink-0"></span>
                <span>Non-Agricultural Commercial / Industrial</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 flex-shrink-0"></span>
                <span>Mutation / Ferfar In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-red-600 flex-shrink-0"></span>
                <span>Demarcation / Boundary Dispute</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Leaflet Map Container with 3D Perspective Mode Support */}
        <div 
          className="lg:col-span-3 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs h-[640px] relative overflow-hidden"
          style={{ perspective: is3DMode ? '1100px' : 'none' }}
        >
          {/* Inner Map Canvas wrapper with hardware-accelerated 3D tilt */}
          <div 
            className="w-full h-full rounded-lg transition-transform duration-300 ease-out origin-center"
            style={{
              transform: is3DMode ? `rotateX(${pitch}deg) rotateZ(${bearing}deg)` : 'none',
              transformStyle: 'preserve-3d',
              boxShadow: is3DMode ? '0 20px 50px rgba(0,0,0,0.35)' : 'none',
            }}
          >
            <div ref={mapContainerRef} className="w-full h-full rounded-lg" />
          </div>

          {/* 3D Mode Live Indicator Badge */}
          {is3DMode && (
            <div className="absolute top-4 right-4 bg-slate-900/90 border border-cyan-500/50 backdrop-blur-md rounded-xl p-2.5 text-xs text-slate-200 pointer-events-none shadow-xl z-20 flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400 animate-spin" />
              <div>
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">3D Perspective Active</div>
                <div className="text-[11px] font-mono text-slate-300">Pitch: {pitch}° • Heading: {bearing}°</div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
