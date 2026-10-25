import React, { useEffect, useRef, useState } from 'react';
import { LandParcel } from '../../types';
import { 
  X, 
  RotateCw, 
  Compass, 
  Sun, 
  Moon, 
  Sunset, 
  Layers, 
  Radio, 
  Activity, 
  Maximize2,
  Gauge
} from 'lucide-react';

interface DroneDigitalTwin3DProps {
  parcel: LandParcel;
  onClose: () => void;
}

type LightingMode = 'day' | 'sunset' | 'night';

export const DroneDigitalTwin3D: React.FC<DroneDigitalTwin3DProps> = ({
  parcel,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [scanProgress, setScanProgress] = useState<number>(68);

  // 3D Camera Orbit State
  const cameraRef = useRef({
    yaw: 45, // horizontal angle in degrees
    pitch: 35, // vertical tilt in degrees
    distance: 380, // zoom distance
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  // Drone Animation State
  const animRef = useRef({
    droneAngle: 0,
    scanLine: 0,
    rotorAngle: 0,
    animationFrameId: 0,
  });

  // Base elevation reference for Nagpur Deccan plateau (meters above sea level)
  const baseElevation = 312.4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    // Handle canvas resizing
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Normalize parcel boundary coordinates to local 3D meter space
    const coords = parcel.boundaryCoordinates || [
      { lat: 21.0820, lng: 79.0850 },
      { lat: 21.0835, lng: 79.0870 },
      { lat: 21.0815, lng: 79.0880 },
      { lat: 21.0805, lng: 79.0860 },
    ];

    const centerLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
    const centerLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;

    // Convert lat/lng offsets to local 3D X/Y meters (approx 111,320m per degree)
    const localPolygon3D = coords.map((c, i) => {
      const x = (c.lng - centerLng) * 111320 * Math.cos((centerLat * Math.PI) / 180);
      const z = -(c.lat - centerLat) * 111320; // -z is North
      // synthetic slight elevation undulation for realism
      const y = Math.sin(i * 1.5) * 3; 
      return { x, y, z, label: c.label || `P${i + 1}` };
    });

    // Auto-scale polygon to fit viewport nicely
    const maxDimension = Math.max(
      ...localPolygon3D.map(p => Math.sqrt(p.x * p.x + p.z * p.z)),
      20
    );
    const scaleFactor = 120 / maxDimension;
    const scaledPoints = localPolygon3D.map(p => ({
      x: p.x * scaleFactor,
      y: p.y * scaleFactor,
      z: p.z * scaleFactor,
      label: p.label,
    }));

    // 3D Point Projection Helper
    const project = (x: number, y: number, z: number, width: number, height: number) => {
      const radYaw = (cameraRef.current.yaw * Math.PI) / 180;
      const radPitch = (cameraRef.current.pitch * Math.PI) / 180;

      // 1. Yaw rotation around Y axis
      const x1 = x * Math.cos(radYaw) - z * Math.sin(radYaw);
      const z1 = x * Math.sin(radYaw) + z * Math.cos(radYaw);
      const y1 = y;

      // 2. Pitch rotation around X axis
      const y2 = y1 * Math.cos(radPitch) - z1 * Math.sin(radPitch);
      const z2 = y1 * Math.sin(radPitch) + z1 * Math.cos(radPitch);
      const x2 = x1;

      // 3. Perspective Projection
      const cameraDistance = cameraRef.current.distance;
      const depth = z2 + cameraDistance;
      const fov = 400;

      if (depth <= 10) return { px: width / 2, py: height / 2, depth, visible: false };

      const px = (x2 * fov) / depth + width / 2;
      const py = (-y2 * fov) / depth + height / 2 + 30; // +30 vertical center bias

      return { px, py, depth, visible: true };
    };

    // Render Loop
    const render = () => {
      if (!isRunning) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Background Sky / Space gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (lightingMode === 'day') {
        skyGrad.addColorStop(0, '#e0f2fe'); // light sky blue
        skyGrad.addColorStop(0.6, '#f0fdf4'); // soft green horizon
        skyGrad.addColorStop(1, '#f8fafc');
      } else if (lightingMode === 'sunset') {
        skyGrad.addColorStop(0, '#1e1b4b'); // deep indigo dusk
        skyGrad.addColorStop(0.5, '#7c2d12'); // orange sunset
        skyGrad.addColorStop(1, '#0f172a');
      } else {
        // Night LiDAR Thermal
        skyGrad.addColorStop(0, '#020617'); // pitch black
        skyGrad.addColorStop(1, '#090d16');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Auto rotation
      if (autoRotate && !cameraRef.current.isDragging) {
        cameraRef.current.yaw = (cameraRef.current.yaw + 0.3) % 360;
      }

      // Update animated elements
      animRef.current.droneAngle += 0.02;
      animRef.current.rotorAngle += 0.6;
      animRef.current.scanLine = (animRef.current.scanLine + 0.8) % 160;

      // 1. Draw 3D Ground Grid & Terrain Relief
      const gridSize = 200;
      const gridStep = 40;
      ctx.lineWidth = 1;
      ctx.strokeStyle = lightingMode === 'night' 
        ? 'rgba(16, 185, 129, 0.15)' 
        : 'rgba(148, 163, 184, 0.25)';

      for (let gx = -gridSize; gx <= gridSize; gx += gridStep) {
        const p1 = project(gx, -15, -gridSize, width, height);
        const p2 = project(gx, -15, gridSize, width, height);
        if (p1.visible && p2.visible) {
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
        }
      }
      for (let gz = -gridSize; gz <= gridSize; gz += gridStep) {
        const p1 = project(-gridSize, -15, gz, width, height);
        const p2 = project(gridSize, -15, gz, width, height);
        if (p1.visible && p2.visible) {
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
        }
      }

      // 2. Draw 3D Extruded Parcel Boundary Walls & Base
      const basePoints = scaledPoints.map(p => project(p.x, -10, p.z, width, height));
      const topPoints = scaledPoints.map(p => project(p.x, 25, p.z, width, height));

      // Draw vertical extruded translucent walls
      for (let i = 0; i < scaledPoints.length; i++) {
        const next = (i + 1) % scaledPoints.length;
        const b1 = basePoints[i];
        const b2 = basePoints[next];
        const t1 = topPoints[i];
        const t2 = topPoints[next];

        if (b1.visible && b2.visible && t1.visible && t2.visible) {
          ctx.beginPath();
          ctx.moveTo(b1.px, b1.py);
          ctx.lineTo(b2.px, b2.py);
          ctx.lineTo(t2.px, t2.py);
          ctx.lineTo(t1.px, t1.py);
          ctx.closePath();

          const wallGrad = ctx.createLinearGradient(b1.px, b1.py, t1.px, t1.py);
          if (lightingMode === 'night') {
            wallGrad.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
            wallGrad.addColorStop(1, 'rgba(6, 182, 212, 0.35)');
          } else {
            wallGrad.addColorStop(0, 'rgba(22, 163, 74, 0.1)');
            wallGrad.addColorStop(1, 'rgba(34, 197, 94, 0.4)');
          }
          ctx.fillStyle = wallGrad;
          ctx.fill();

          ctx.strokeStyle = lightingMode === 'night' 
            ? 'rgba(6, 182, 212, 0.8)' 
            : 'rgba(21, 128, 61, 0.9)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Draw Top Parcel Cap (surface polygon)
      ctx.beginPath();
      topPoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      });
      ctx.closePath();

      if (lightingMode === 'night') {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      } else if (lightingMode === 'sunset') {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      } else {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
      }
      ctx.fill();
      ctx.strokeStyle = lightingMode === 'night' ? '#22d3ee' : '#15803d';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 3. Draw Corner Survey Markers & Total Station Elevation Pins
      scaledPoints.forEach((p, i) => {
        const topPt = topPoints[i];
        const basePt = basePoints[i];
        if (!topPt.visible) return;

        // Vertical pillar line
        ctx.beginPath();
        ctx.moveTo(basePt.px, basePt.py);
        ctx.lineTo(topPt.px, topPt.py);
        ctx.strokeStyle = lightingMode === 'night' ? '#38bdf8' : '#eab308';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 3D Prism Marker Circle
        ctx.beginPath();
        ctx.arc(topPt.px, topPt.py, 5, 0, Math.PI * 2);
        ctx.fillStyle = lightingMode === 'night' ? '#38bdf8' : '#eab308';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Elevation tag badge
        const elev = (baseElevation + p.y * 0.1).toFixed(1);
        ctx.font = '10px monospace';
        ctx.fillStyle = lightingMode === 'night' ? '#ffffff' : '#0f172a';
        ctx.fillText(`${p.label || `P${i+1}`}: +${elev}m`, topPt.px + 8, topPt.py - 6);
      });

      // 4. Live 3D Autonomous Survey Drone & LiDAR Projection
      const droneRadius = 80;
      const droneX = Math.cos(animRef.current.droneAngle) * droneRadius;
      const droneZ = Math.sin(animRef.current.droneAngle) * droneRadius;
      const droneY = 90; // flight height 90m in 3D scene

      const dronePt = project(droneX, droneY, droneZ, width, height);

      if (dronePt.visible) {
        // LiDAR Scanning Laser Cone to active parcel center
        const centerPt = project(0, 25, 0, width, height);
        if (centerPt.visible) {
          const coneGrad = ctx.createLinearGradient(dronePt.px, dronePt.py, centerPt.px, centerPt.py);
          coneGrad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
          coneGrad.addColorStop(0.4, 'rgba(239, 68, 68, 0.25)');
          coneGrad.addColorStop(1, 'rgba(239, 68, 68, 0.02)');

          ctx.beginPath();
          ctx.moveTo(dronePt.px, dronePt.py);
          ctx.lineTo(centerPt.px - 35, centerPt.py);
          ctx.lineTo(centerPt.px + 35, centerPt.py);
          ctx.closePath();
          ctx.fillStyle = coneGrad;
          ctx.fill();

          // Laser scan line
          ctx.beginPath();
          ctx.moveTo(dronePt.px, dronePt.py);
          ctx.lineTo(centerPt.px, centerPt.py);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Drone Body
        ctx.save();
        ctx.translate(dronePt.px, dronePt.py);

        // Quadcopter Arms
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-16, -16);
        ctx.lineTo(16, 16);
        ctx.moveTo(16, -16);
        ctx.lineTo(-16, 16);
        ctx.stroke();

        // 4 Rotors
        const rotorOffset = 16;
        const rAngle = animRef.current.rotorAngle;
        const armCoords = [
          [-rotorOffset, -rotorOffset],
          [rotorOffset, -rotorOffset],
          [rotorOffset, rotorOffset],
          [-rotorOffset, rotorOffset],
        ];

        armCoords.forEach(([ax, ay]) => {
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(rAngle);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.fillRect(-7, -1, 14, 2);
          ctx.restore();
        });

        // Center fuselage
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Flashing navigation LED
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = (Math.floor(Date.now() / 400) % 2 === 0) ? '#22c55e' : '#ef4444';
        ctx.fill();

        ctx.restore();
      }

      animRef.current.animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animRef.current.animationFrameId);
    };
  }, [parcel, lightingMode, autoRotate]);

  // Mouse drag handlers for 3D orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    cameraRef.current.isDragging = true;
    cameraRef.current.lastMouseX = e.clientX;
    cameraRef.current.lastMouseY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cameraRef.current.isDragging) return;
    const dx = e.clientX - cameraRef.current.lastMouseX;
    const dy = e.clientY - cameraRef.current.lastMouseY;

    cameraRef.current.yaw = (cameraRef.current.yaw + dx * 0.5) % 360;
    cameraRef.current.pitch = Math.max(10, Math.min(85, cameraRef.current.pitch - dy * 0.4));

    cameraRef.current.lastMouseX = e.clientX;
    cameraRef.current.lastMouseY = e.clientY;
  };

  const handleMouseUp = () => {
    cameraRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraRef.current.distance = Math.max(180, Math.min(700, cameraRef.current.distance + e.deltaY * 0.5));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex-shrink-0 px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Live 3D Cadastral Digital Twin & Drone LiDAR Scan (3D डिजिटल ट्विन)
                </h3>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-700/50">
                  RTK FIXED (±1.8cm)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gat No. {parcel.gatNumber} ({parcel.village}, {parcel.district}) • ULPIN: {parcel.ulpin}
              </p>
            </div>
          </div>

          {/* Right Toolbar */}
          <div className="flex items-center gap-2">
            
            {/* Lighting Mode Selector */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setLightingMode('day')}
                title="Daylight Mode"
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  lightingMode === 'day' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLightingMode('sunset')}
                title="Sunset / Golden Hour"
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  lightingMode === 'sunset' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sunset className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLightingMode('night')}
                title="LiDAR Night Thermal"
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  lightingMode === 'night' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auto Rotate Toggle */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                autoRotate 
                  ? 'bg-slate-800 text-emerald-400 border-slate-700' 
                  : 'bg-slate-800/50 text-slate-400 border-slate-700'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{autoRotate ? 'Orbiting' : 'Paused'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* 3D Canvas Viewport */}
        <div 
          className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Real-time Telemetry HUD Overlay (Top-Left) */}
          <div className="absolute top-4 left-4 bg-slate-950/80 border border-slate-800/80 backdrop-blur-md rounded-xl p-3 text-xs text-slate-300 pointer-events-none space-y-2 w-64 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                UAV Flight Telemetry
              </span>
              <span className="text-[10px] font-mono text-slate-400">MAVLink v2.0</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-500 block">Flight Altitude</span>
                <span className="font-mono font-bold text-slate-200">120.0 m AGL</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Ground Speed</span>
                <span className="font-mono font-bold text-slate-200">14.2 km/h</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">RTK Precision</span>
                <span className="font-mono font-bold text-emerald-400">±1.8 cm Fixed</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Satellites (NavIC)</span>
                <span className="font-mono font-bold text-slate-200">18 Locked</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Ortho Point Cloud Sweep</span>
                <span className="font-mono text-emerald-400">{scanProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3D Orbit Help Badge (Bottom-Left) */}
          <div className="absolute bottom-4 left-4 bg-slate-950/70 border border-slate-800/80 backdrop-blur-xs rounded-lg px-3 py-1.5 text-[10px] text-slate-400 pointer-events-none flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Click & Drag to rotate 3D orbit • Scroll to Zoom In/Out</span>
          </div>

          {/* Cadastral Specs Card (Bottom-Right) */}
          <div className="absolute bottom-4 right-4 bg-slate-950/80 border border-slate-800/80 backdrop-blur-md rounded-xl p-3 text-xs text-slate-300 pointer-events-none space-y-1.5 w-60 shadow-lg">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cadastral Plot Spec
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Gat / Survey:</span>
              <strong className="text-slate-200">Gat {parcel.gatNumber}</strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Total Area:</span>
              <strong className="text-slate-200">{parcel.areaHectare}H {parcel.areaAre}R ({parcel.totalAreaSqm.toLocaleString()} m²)</strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Base Elevation:</span>
              <strong className="text-emerald-400 font-mono">~312.4m MSL (Nagpur)</strong>
            </div>
          </div>

        </div>

        {/* Modal Bottom Status Bar */}
        <div className="flex-shrink-0 px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>LiDAR Sensor: Riegl VUX-1UAV • 64-Beam Multispectral Sensor • Photogrammetry 1.2 GSD</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition-colors"
          >
            Back to Cadastral Map
          </button>
        </div>

      </div>

    </div>
  );
};
