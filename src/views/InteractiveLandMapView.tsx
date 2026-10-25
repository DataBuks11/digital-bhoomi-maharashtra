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
  Navigation
} from 'lucide-react';
import L from 'leaflet';
import { ActiveTab } from '../components/layout/Sidebar';

interface InteractiveLandMapViewProps {
  parcels: LandParcel[];
  ownerships: OwnershipRecord[];
  onNavigate: (tab: ActiveTab, params?: any) => void;
}

export const InteractiveLandMapView: React.FC<InteractiveLandMapViewProps> = ({
  parcels,
  ownerships,
  onNavigate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonsGroupRef = useRef<L.LayerGroup | null>(null);
  const measureGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(parcels[0] || null);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [measuredAreaSqm, setMeasuredAreaSqm] = useState<number | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map centered on Maharashtra
      const map = L.map(mapContainerRef.current, {
        center: [18.5780, 73.9850], // Pune Wagholi / Haveli region by default
        zoom: 14,
        zoomControl: true,
      });

      // Standard OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Digital Bhoomi Maharashtra Demo',
        maxZoom: 19,
      }).addTo(map);

      polygonsGroupRef.current = L.layerGroup().addTo(map);
      measureGroupRef.current = L.layerGroup().addTo(map);

      // Measurement click handler
      map.on('click', (e: L.LeafletMouseEvent) => {
        // Handled in dynamic listener below
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Measurement mode map clicks
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!measureMode) return;
      const newPoints = [...measurePoints, e.latlng];
      setMeasurePoints(newPoints);

      // Draw markers and temporary lines
      if (measureGroupRef.current) {
        measureGroupRef.current.clearLayers();
        
        newPoints.forEach((pt, i) => {
          L.circleMarker(pt, { radius: 5, color: '#dc2626', fillOpacity: 0.9 })
            .bindTooltip(`P${i+1}`, { permanent: true, direction: 'top' })
            .addTo(measureGroupRef.current!);
        });

        if (newPoints.length > 1) {
          L.polyline(newPoints, { color: '#dc2626', dashArray: '5, 5', weight: 2 })
            .addTo(measureGroupRef.current!);
        }

        if (newPoints.length >= 3) {
          L.polygon(newPoints, { color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.2 })
            .addTo(measureGroupRef.current!);

          // Approximate Shoelace formula on projected coordinates
          let area = 0;
          for (let i = 0; i < newPoints.length; i++) {
            const j = (i + 1) % newPoints.length;
            const p1 = map.project(newPoints[i]);
            const p2 = map.project(newPoints[j]);
            area += (p1.x * p2.y) - (p2.x * p1.y);
          }
          // Scale pixel area to approx meters at zoom level
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

  // Render Parcels onto Map
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

        const polygon = L.polygon(latLngs, {
          color: isSelected ? '#000000' : color,
          weight: isSelected ? 3 : 2,
          fillColor: fillColor,
          fillOpacity: isSelected ? 0.5 : 0.25,
        });

        // Add corner marker pins
        parcel.boundaryCoordinates.forEach((coord, i) => {
          L.circleMarker([coord.lat, coord.lng], {
            radius: 3,
            color: color,
            fillColor: '#ffffff',
            fillOpacity: 1,
            weight: 1.5,
          }).bindTooltip(`${coord.label || `Marker ${i+1}`}`, { direction: 'top' })
            .addTo(group);
        });

        // Polygon tooltip
        polygon.bindTooltip(
          `<strong>Gat No. ${parcel.gatNumber}</strong> (${parcel.village})<br/>${parcel.areaHectare}H ${parcel.areaAre}R`,
          { sticky: true }
        );

        polygon.on('click', () => {
          setSelectedParcel(parcel);
        });

        polygon.addTo(group);
      }
    });
  }, [parcels, selectedParcel, selectedDistrict]);

  // Center on Selected Parcel
  const flyToParcel = (parcel: LandParcel) => {
    setSelectedParcel(parcel);
    const map = mapInstanceRef.current;
    if (map && parcel.boundaryCoordinates && parcel.boundaryCoordinates.length > 0) {
      const bounds = L.latLngBounds(parcel.boundaryCoordinates.map(c => [c.lat, c.lng]));
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 17, duration: 1 });
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
      
      {/* Map Control Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-emerald-700" />
            Interactive Cadastral Land Map (महाराष्ट्र भू-नकाशा)
          </h2>
          <p className="text-xs text-slate-500">
            Cadastral plot boundaries, Total Station GPS coordinates, and real-time polygon inspection.
          </p>
        </div>

        {/* Toolbar & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Maharashtra Districts</option>
            <option value="Pune">Pune District</option>
            <option value="Nagpur">Nagpur District</option>
            <option value="Nashik">Nashik District</option>
            <option value="Chhatrapati Sambhaji Nagar">Chhatrapati Sambhaji Nagar</option>
            <option value="Thane">Thane District</option>
          </select>

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
            {measureMode ? 'Exit Measuring' : 'Measure Tool'}
          </button>

          {measureMode && (
            <button
              onClick={clearMeasurement}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors border border-slate-200"
            >
              Reset Points
            </button>
          )}

        </div>
      </div>

      {/* Cadastral Measurement & Boundary Disclaimer */}
      <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Illustrative Demonstration Map (नमुना नकाशा सूचना):</strong> Parcel boundary polygons and onscreen area calculations displayed in this prototype are synthetic, approximate geometric representations for system visualization. They do <em>not</em> represent certified statutory cadastral map sheets (क किंवा टीपणी नकाशा) and cannot be cited in legal demarcation, land dispute, or conveyancing proceedings under the Maharashtra Land Revenue Code.
        </div>
      </div>

      {/* Measurement HUD banner */}
      {measureMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700" />
            <span>
              <strong>Measurement Active:</strong> Click 3 or more points on the map to calculate approximate parcel boundary perimeter and area.
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
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              Select any parcel on the map or list to inspect details.
            </div>
          )}

          {/* Quick Parcel Selector List */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs max-h-72 overflow-y-auto space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
              Parcels in View ({parcels.length})
            </div>
            {parcels.map((p) => (
              <button
                key={p.id}
                onClick={() => flyToParcel(p)}
                className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  selectedParcel?.id === p.id 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold' 
                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                }`}
              >
                <div>
                  <div className="font-bold">Gat {p.gatNumber} - {p.village}</div>
                  <div className="text-[10px] text-slate-500">{p.district} ({p.areaHectare}H {p.areaAre}R)</div>
                </div>
                <Navigation className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-700" />
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

        {/* Right: Leaflet Map Container */}
        <div className="lg:col-span-3 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs h-[580px] relative overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full rounded-lg" />
        </div>

      </div>

    </div>
  );
};
