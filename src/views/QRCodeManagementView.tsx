import React, { useState, useEffect, useRef } from 'react';
import { 
  LandParcel, 
  QRCodeRecord, 
  UserProfile 
} from '../types';
import { 
  QrCode, 
  Camera, 
  Upload, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Printer, 
  Download, 
  ExternalLink,
  ShieldCheck,
  FileText,
  RotateCw,
  Copy,
  Check,
  Info
} from 'lucide-react';
import { dataService } from '../services/dataService';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import { ActiveTab } from '../components/layout/Sidebar';

interface QRCodeManagementViewProps {
  parcels: LandParcel[];
  qrCodes: QRCodeRecord[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onNavigate: (tab: ActiveTab, params?: any) => void;
  initialSelectedParcelId?: string;
}

export const QRCodeManagementView: React.FC<QRCodeManagementViewProps> = ({
  parcels,
  qrCodes,
  currentUser,
  onRefresh,
  onNavigate,
  initialSelectedParcelId,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'generate'>('scan');
  
  // Generator State
  const [selectedParcelId, setSelectedParcelId] = useState<string>(
    initialSelectedParcelId || parcels[0]?.id || ''
  );
  const [generatedQRDataUrl, setGeneratedQRDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Scanner State
  const [scanResult, setScanResult] = useState<{
    isValid: boolean;
    parcel?: LandParcel;
    qrRecord?: QRCodeRecord;
    message: string;
    rawIdentifier?: string;
  } | null>(null);

  const [manualQuery, setManualQuery] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'html5-qrcode-reader-element';

  // Selected Parcel for Generator
  const currentParcel = parcels.find(p => p.id === selectedParcelId) || parcels[0];
  const currentQRRecord = qrCodes.find(q => q.parcelId === currentParcel?.id);

  // Generate QR Canvas/DataUrl when parcel changes
  useEffect(() => {
    if (currentParcel && currentQRRecord) {
      const payload = currentQRRecord.qrIdentifier;
      QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      }).then((url) => {
        setGeneratedQRDataUrl(url);
      }).catch(err => console.error(err));
    }
  }, [currentParcel, currentQRRecord]);

  // Clean up camera scanner on unmount
  useEffect(() => {
    return () => {
      if (qrReaderRef.current) {
        qrReaderRef.current.stop().catch(() => {}).then(() => {
          qrReaderRef.current?.clear();
        });
      }
    };
  }, []);

  // Process a scanned / submitted QR string
  const processQRString = (rawText: string) => {
    const clean = rawText.trim();
    const result = dataService.recordQRScan(clean);
    setScanResult({
      ...result,
      rawIdentifier: clean,
    });
    onRefresh();
  };

  // Start live webcam scanning
  const startCameraScanner = async () => {
    setScannerError(null);
    setScanResult(null);

    try {
      if (!qrReaderRef.current) {
        qrReaderRef.current = new Html5Qrcode(qrRegionId);
      }

      await qrReaderRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          processQRString(decodedText);
          stopCameraScanner();
        },
        (errorMessage) => {
          // ignore transient frame decode errors
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      const isHttp = typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      if (isHttp) {
        setScannerError('Mobile Browser Camera Limitation: W3C MediaDevices API requires a Secure Context (HTTPS or localhost). On mobile devices connecting via plain HTTP, please use "Upload QR Image" or "Manual Identifier Search" below.');
      } else {
        setScannerError('Could not access camera (permission denied or no camera hardware). Please allow camera permissions or use "Upload QR Image" or "Manual Identifier Search" below.');
      }
      setIsCameraActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (qrReaderRef.current && qrReaderRef.current.isScanning) {
      try {
        await qrReaderRef.current.stop();
      } catch (e) {}
    }
    setIsCameraActive(false);
  };

  // Handle Image File Upload for QR decode
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerError(null);
    setScanResult(null);

    try {
      const html5Qr = new Html5Qrcode('file-scanner-temp-element');
      const decoded = await html5Qr.scanFile(file, true);
      processQRString(decoded);
      html5Qr.clear();
    } catch (err: any) {
      setScannerError('No valid Bhu-Aadhaar QR Code could be detected in this uploaded image.');
    }
  };

  // Handle Manual Fallback Input (supports ULPIN, Parcel ID, Gat Number, or raw QR Token)
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualQuery.trim();
    if (!query) return;

    // 1. Check if input is ULPIN
    const parcelByULPIN = dataService.getParcelByULPIN(query);
    if (parcelByULPIN) {
      const qrRec = qrCodes.find(q => q.parcelId === parcelByULPIN.id);
      if (qrRec) {
        processQRString(qrRec.qrIdentifier);
        return;
      }
    }

    // 2. Check if input is internal Parcel ID (e.g. 'p-01', 'p-1729...')
    const parcelById = parcels.find(p => p.id.toLowerCase() === query.toLowerCase());
    if (parcelById) {
      const qrRec = qrCodes.find(q => q.parcelId === parcelById.id);
      if (qrRec) {
        processQRString(qrRec.qrIdentifier);
        return;
      }
    }

    // 3. Check if input is a Gat Number (e.g. '142', 'Gat 142', 'Gat No 142')
    const cleanGat = query.replace(/^(gat|gut|survey|cts)[\s#:]*(no\.?)?/i, '').trim();
    const parcelByGat = parcels.find(p => 
      p.gatNumber.toLowerCase() === cleanGat.toLowerCase() || 
      p.gatNumber.toLowerCase() === query.toLowerCase()
    );
    if (parcelByGat) {
      const qrRec = qrCodes.find(q => q.parcelId === parcelByGat.id);
      if (qrRec) {
        processQRString(qrRec.qrIdentifier);
        return;
      }
    }

    // 4. Direct QR identifier lookup
    processQRString(query);
  };

  const handleCopyIdentifier = () => {
    if (currentQRRecord) {
      navigator.clipboard.writeText(currentQRRecord.qrIdentifier);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPNG = () => {
    if (!generatedQRDataUrl) return;
    const a = document.createElement('a');
    a.href = generatedQRDataUrl;
    a.download = `QR_${currentParcel?.ulpin || 'Bhoomi'}.png`;
    a.click();
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-700" />
            Secure Bhu-Aadhaar QR Engine (डिजिटल भू-आधार क्यूआर प्रणाली)
          </h2>
          <p className="text-xs text-slate-500">
            Cryptographic parcel identification, camera verification, revocation checks, and tamper-evident certificate printing.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => {
              setActiveTab('scan');
              stopCameraScanner();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'scan' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Scan & Verify
          </button>
          <button
            onClick={() => {
              setActiveTab('generate');
              stopCameraScanner();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'generate' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Generate & Print
          </button>
        </div>
      </div>

      {/* Invisible element for temporary file scanning */}
      <div id="file-scanner-temp-element" style={{ display: 'none' }} />

      {/* TAB 1: SCAN & VERIFY */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Scanner Controls Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Scan QR Identifier</h3>
              <p className="text-xs text-slate-500">Use live video camera, upload document image, or enter ULPIN</p>
            </div>

            {/* Video Region */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 min-h-[260px] flex flex-col items-center justify-center relative overflow-hidden">
              <div id={qrRegionId} className="w-full max-w-[280px]" />

              {!isCameraActive && (
                <div className="space-y-2 py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-slate-700 text-xs">Live Camera Scanner</div>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Point your camera at a printed Digital Bhoomi 7/12 extract or Property Card.
                  </p>
                  <button
                    onClick={startCameraScanner}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    Activate Camera
                  </button>
                </div>
              )}

              {isCameraActive && (
                <button
                  onClick={stopCameraScanner}
                  className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Stop Camera
                </button>
              )}
            </div>

            {scannerError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{scannerError}</span>
              </div>
            )}

            {/* Alternative Scanner: Image Upload */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Upload QR Image / Document:</span>
              <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200">
                <Upload className="w-3.5 h-3.5" /> Select File
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Fallback Manual Search */}
            <form onSubmit={handleManualSearch} className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-slate-600 text-xs font-medium">
                Manual Fallback (Enter ULPIN or Bhu-Aadhaar QR String):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. MHPUNHAV000142A or BHOOMI-MH-PUN-HAV-GAT142-SEC99"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Verify
                </button>
              </div>
            </form>

            {/* Sample Quick Testing Buttons */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 block mb-1">Quick Sample Tests:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => processQRString('BHOOMI-MH-PUN-HAV-GAT142-SEC99')}
                  className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono"
                >
                  Test Active (Gat 142)
                </button>
                <button
                  type="button"
                  onClick={() => processQRString('BHOOMI-MH-THA-KAL-GAT215-SEC91')}
                  className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono"
                >
                  Test Inactive (Gat 215)
                </button>
                <button
                  type="button"
                  onClick={() => processQRString('MALFORMED-FAKE-QR-TOKEN-999')}
                  className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 font-mono"
                >
                  Test Invalid Fake QR
                </button>
              </div>
            </div>

          </div>

          {/* Verification Results Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-3">Verification Findings</h3>

              {!scanResult ? (
                <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                  <ShieldCheck className="w-10 h-10 mx-auto text-slate-300" />
                  <p>Awaiting QR scan or manual identifier submission.</p>
                  <p className="text-[11px] text-slate-400">
                    Scanned tokens are verified against the cryptographic hash in the state registry.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* Status Banner */}
                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    scanResult.isValid 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                      : scanResult.qrRecord?.status === 'INACTIVE'
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-red-50 border-red-200 text-red-950'
                  }`}>
                    {scanResult.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-sm">
                        {scanResult.isValid ? 'Prototype Record Verified (नमुना नोंद पडताळणी)' : 'Verification Issue Detected'}
                      </div>
                      <p className="text-xs mt-0.5 opacity-90">{scanResult.message}</p>
                    </div>
                  </div>

                  {/* Statutory Legal Disclaimer Notice */}
                  <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Legal Disclaimer:</strong> Demonstration verification only. Cryptographic matching against this prototype database confirms sample registry presence; it does <em>not</em> constitute statutory proof of unencumbered legal title or official ownership under the Maharashtra Land Revenue Code, 1966.
                    </span>
                  </div>

                  {/* Scanned Payload Details */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                      Scanned Token Payload
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-800 break-all">
                      {scanResult.rawIdentifier}
                    </div>
                    {scanResult.qrRecord && (
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex items-center justify-between">
                        <span>Total Scans Logged: <strong>{scanResult.qrRecord.scansCount}</strong></span>
                        <span>Status: <strong className="uppercase">{scanResult.qrRecord.status}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Associated Parcel Info */}
                  {scanResult.parcel && (
                    <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200 text-xs space-y-2">
                      <div className="font-bold text-emerald-900 flex items-center justify-between">
                        <span>Gat No. {scanResult.parcel.gatNumber} ({scanResult.parcel.village})</span>
                        <span className="font-mono font-medium">{scanResult.parcel.ulpin}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                        <div>District: <strong>{scanResult.parcel.district}</strong></div>
                        <div>Taluka: <strong>{scanResult.parcel.taluka}</strong></div>
                        <div>Area: <strong>{scanResult.parcel.areaHectare}H {scanResult.parcel.areaAre}R</strong></div>
                        <div>Land Type: <strong>{scanResult.parcel.landType.replace(/_/g, ' ')}</strong></div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {scanResult?.parcel && (
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => onNavigate('records', { selectedParcelId: scanResult.parcel?.id })}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Open Full 7/12 Extract
                </button>
                <button
                  onClick={() => onNavigate('cards', { selectedParcelId: scanResult.parcel?.id })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
                >
                  Property Card
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: GENERATE & PRINT QR */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Controls & Configuration */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Generate Bhu-Aadhaar QR Code</h3>
              <p className="text-xs text-slate-500">Produce cryptographic QR identifiers for Maharashtra land parcels</p>
            </div>

            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1">
                Select Land Parcel to Encode
              </label>
              <select
                value={selectedParcelId}
                onChange={(e) => setSelectedParcelId(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-slate-50 text-slate-900 font-medium"
              >
                {parcels.map(p => (
                  <option key={p.id} value={p.id}>
                    Gat {p.gatNumber} - {p.village}, {p.taluka} ({p.ulpin})
                  </option>
                ))}
              </select>
            </div>

            {currentParcel && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-800">Parcel Specifications</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div>ULPIN: <strong className="font-mono text-emerald-800">{currentParcel.ulpin}</strong></div>
                  <div>Gat No: <strong>{currentParcel.gatNumber}</strong></div>
                  <div>District: <strong>{currentParcel.district}</strong></div>
                  <div>Area: <strong>{currentParcel.areaHectare}H {currentParcel.areaAre}R</strong></div>
                  <div>Status: <strong>{currentParcel.status}</strong></div>
                  <div>Tax: <strong>₹ {currentParcel.assessmentTax}</strong></div>
                </div>
              </div>
            )}

            {currentQRRecord && (
              <div className="space-y-2 text-xs">
                <label className="block text-slate-600 font-semibold">Encoded QR Identifier String</label>
                <div className="p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg break-all flex items-center justify-between gap-2">
                  <span>{currentQRRecord.qrIdentifier}</span>
                  <button
                    onClick={handleCopyIdentifier}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Copy string"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Secure cryptographic token prevents unauthorized duplication and links directly to the state record.
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleDownloadPNG}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" /> Download QR Code (PNG)
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <Printer className="w-4 h-4" /> Print Certificate
              </button>
            </div>

          </div>

          {/* Printable Official Government QR Certificate Preview */}
          <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm demo-watermark-overlay text-center" id="printable-document">
            
            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-3 mb-4">
              <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-0.5">
                *** शासकीय भू-अभिलेख प्रात्यक्षिक प्रत ***
              </div>
              <h3 className="font-bold text-base text-slate-900 uppercase">
                GOVERNMENT OF MAHARASHTRA - REVENUE DEPARTMENT
              </h3>
              <div className="text-xs font-semibold text-slate-700">
                DIGITAL BHU-AADHAAR PARCEL IDENTIFICATION SEAL
              </div>
            </div>

            {/* QR Image with seal */}
            <div className="py-2 inline-block">
              <div className="p-3 bg-white border-2 border-emerald-800 rounded-xl shadow-md inline-block">
                {generatedQRDataUrl ? (
                  <img
                    src={generatedQRDataUrl}
                    alt="Digital Bhoomi QR"
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    Generating QR...
                  </div>
                )}
                <div className="mt-2 text-[10px] font-mono font-bold text-slate-900">
                  {currentParcel?.ulpin}
                </div>
              </div>
            </div>

            {/* Details Table */}
            <div className="mt-4 text-xs text-left max-w-sm mx-auto bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <div><strong>Gat / Survey:</strong> Gat No. {currentParcel?.gatNumber} (Sub {currentParcel?.subDivision})</div>
              <div><strong>Location:</strong> {currentParcel?.village}, {currentParcel?.taluka}, {currentParcel?.district}</div>
              <div><strong>Total Area:</strong> {currentParcel?.areaHectare} Hectare {currentParcel?.areaAre} Are</div>
              <div><strong>Classification:</strong> {currentParcel?.landType.replace(/_/g, ' ')}</div>
              <div><strong>Generated Date:</strong> {new Date().toLocaleDateString('en-IN')}</div>
            </div>

            {/* Legal Notice */}
            <p className="mt-4 text-[9px] text-slate-500 max-w-sm mx-auto leading-tight">
              Notice: This QR Code is an authentic digital identifier for verification under the Maharashtra Land Records Modernization Prototype. Scan using authorized Digital Bhoomi portal to view live 7/12 extract.
            </p>

          </div>

        </div>
      )}

    </div>
  );
};
