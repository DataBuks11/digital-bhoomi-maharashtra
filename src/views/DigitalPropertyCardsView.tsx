import React, { useState, useEffect } from 'react';
import { 
  LandParcel, 
  OwnershipRecord, 
  QRCodeRecord, 
  UserProfile 
} from '../types';
import { 
  CreditCard, 
  Printer, 
  Download, 
  Search, 
  ShieldCheck, 
  Building, 
  QrCode, 
  FileText,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { formatCurrencyINR, formatDateIndian } from '../lib/utils';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { ActiveTab } from '../components/layout/Sidebar';

interface DigitalPropertyCardsViewProps {
  parcels: LandParcel[];
  ownerships: OwnershipRecord[];
  qrCodes: QRCodeRecord[];
  currentUser: UserProfile;
  onNavigate: (tab: ActiveTab, params?: any) => void;
  initialSelectedParcelId?: string;
}

export const DigitalPropertyCardsView: React.FC<DigitalPropertyCardsViewProps> = ({
  parcels,
  ownerships,
  qrCodes,
  currentUser,
  onNavigate,
  initialSelectedParcelId,
}) => {
  const [selectedParcelId, setSelectedParcelId] = useState<string>(
    initialSelectedParcelId || parcels[0]?.id || ''
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const currentParcel = parcels.find(p => p.id === selectedParcelId) || parcels[0];
  const currentOwners = ownerships.filter(o => o.parcelId === currentParcel?.id);
  const currentQR = qrCodes.find(q => q.parcelId === currentParcel?.id);

  // Generate QR for Property Card
  useEffect(() => {
    if (currentParcel && currentQR) {
      QRCode.toDataURL(currentQR.qrIdentifier, {
        width: 180,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      }).then(url => setQrDataUrl(url)).catch(() => {});
    }
  }, [currentParcel, currentQR]);

  // Export PDF
  const handleExportPDF = () => {
    if (!currentParcel) return;
    const doc = new jsPDF();

    // Border
    doc.setDrawColor(21, 128, 61);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 190, 277);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, 186, 273);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(21, 128, 61);
    doc.text('GOVERNMENT OF MAHARASHTRA', 105, 24, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('REVENUE & FOREST DEPARTMENT', 105, 30, { align: 'center' });
    doc.text('DIGITAL PROPERTY CARD (MALMATTA PATRAK / AKHIV PATRIKA)', 105, 36, { align: 'center' });

    // Demo Watermark
    doc.setFontSize(32);
    doc.setTextColor(220, 38, 38);
    doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
    doc.text('PROTOTYPE DEMONSTRATION RECORD', 105, 140, { align: 'center', angle: 45 });
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Metadata Table
    doc.setFillColor(248, 250, 252);
    doc.rect(16, 44, 178, 28, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`District: ${currentParcel.district}`, 20, 52);
    doc.text(`Taluka: ${currentParcel.taluka}`, 80, 52);
    doc.text(`Village: ${currentParcel.village}`, 140, 52);

    doc.text(`Gat No: ${currentParcel.gatNumber}`, 20, 60);
    doc.text(`Survey No: ${currentParcel.surveyNumber}`, 80, 60);
    doc.text(`Sub-division: ${currentParcel.subDivision}`, 140, 60);

    doc.setFont('helvetica', 'bold');
    doc.text(`Bhu-Aadhaar (ULPIN): ${currentParcel.ulpin}`, 20, 68);
    doc.text(`Generated Date: ${new Date().toLocaleDateString('en-IN')}`, 130, 68);

    // Land Specification Section
    doc.rect(16, 76, 178, 32);
    doc.setFillColor(241, 245, 249);
    doc.rect(16, 76, 178, 7, 'F');
    doc.text('LAND ATTRIBUTES & CLASSIFICATION', 20, 81);

    doc.setFont('helvetica', 'normal');
    doc.text(`Total Area: ${currentParcel.areaHectare} Ha ${currentParcel.areaAre} Are (${currentParcel.totalAreaSqm.toLocaleString()} sq.m)`, 20, 90);
    doc.text(`Tenure: ${currentParcel.tenureType.replace(/_/g, ' ')}`, 110, 90);

    doc.text(`Classification: ${currentParcel.landType.replace(/_/g, ' ')}`, 20, 98);
    doc.text(`Pot Kharaba: ${currentParcel.potKharabaSqm} sq.m`, 110, 98);

    doc.text(`Annual Assessment Tax: Rs. ${currentParcel.assessmentTax}`, 20, 105);
    doc.text(`Cadastral Status: ${currentParcel.status}`, 110, 105);

    // Owners Table
    doc.rect(16, 114, 178, 55);
    doc.setFillColor(241, 245, 249);
    doc.rect(16, 114, 178, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTERED OCCUPANTS & KHATEDARS (हक्क नोंदी)', 20, 119);

    doc.setFontSize(8);
    let y = 127;
    currentOwners.forEach((o, i) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${i+1}. ${o.ownerName} (${o.relationType})`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Khata: ${o.khataNumber} | Share: ${o.sharePercentage}% | Aadhaar: ${o.aadhaarMasked}`, 110, y);
      y += 8;
    });

    // Encumbrances
    doc.rect(16, 175, 178, 30);
    doc.setFillColor(241, 245, 249);
    doc.rect(16, 175, 178, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('LIABILITIES & ENCUMBRANCES (बोजा व इतर हक्क)', 20, 180);

    doc.setFont('helvetica', 'normal');
    doc.text('No pending government attachment or civil court stays recorded on this sample parcel.', 20, 190);
    doc.text('Notice: Illustrative demo simulation. Does not constitute statutory title clearance under MLRC 1966.', 20, 196);

    // QR Image
    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', 20, 215, 38, 38);
      } catch (e) {}
    }

    // Seal and Signature
    doc.setFont('helvetica', 'bold');
    doc.text('Verification Node (Demonstration Only):', 75, 222);
    doc.setFont('helvetica', 'normal');
    doc.text('Prototype Officer Node (Not an Official Statutory Certificate)', 75, 228);
    doc.text(`Cryptographic QR Token: ${currentQR?.qrIdentifier || currentParcel.ulpin}`, 75, 235);
    doc.text('Scan embedded QR using Digital Bhoomi to inspect prototype registry match.', 75, 241);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('PROTOTYPE DEMONSTRATION DOCUMENT - NOT A VALID LEGAL INSTRUMENT OR PROPERTY TITLE', 105, 276, { align: 'center' });
    doc.text('Demonstration prototype document generated by Digital Bhoomi Maharashtra. For concept review only.', 105, 281, { align: 'center' });

    doc.save(`Property_Card_${currentParcel.ulpin}.pdf`);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-700" />
            Digital Property Card (डिजिटल मिळकत पत्रिका / आखिव पत्रिका)
          </h2>
          <p className="text-xs text-slate-500">
            Official standardized property card with embedded cryptographic QR, Ready Reckoner valuation, and PDF export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF Card
          </button>
        </div>
      </div>

      {/* Parcel Selector */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Select Parcel:
        </span>
        <select
          value={selectedParcelId}
          onChange={(e) => setSelectedParcelId(e.target.value)}
          className="w-full max-w-md p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
        >
          {parcels.map(p => (
            <option key={p.id} value={p.id}>
              Gat No. {p.gatNumber} - {p.village}, {p.taluka} ({p.ulpin})
            </option>
          ))}
        </select>
      </div>

      {/* The Printable Official Maharashtra Digital Property Card */}
      <div className="bg-white rounded-2xl border-2 border-slate-800 shadow-md p-6 max-w-3xl mx-auto demo-watermark-overlay relative" id="printable-document">
        
        {/* Header */}
        <div className="text-center pb-4 border-b-2 border-slate-800 mb-5">
          <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">
            *** प्रात्यक्षिक नमुना प्रत (DEMONSTRATION PROPERTY CARD - NOT A LEGAL COURT DOCUMENT) ***
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-800 text-amber-300 font-serif font-bold text-xl flex items-center justify-center mx-auto mb-2 border-2 border-emerald-950">
            महा
          </div>
          <h2 className="text-base md:text-lg font-bold text-slate-900 uppercase tracking-wide">
            महाराष्ट्र शासन - महसूल व वन विभाग
          </h2>
          <div className="text-xs md:text-sm font-semibold text-slate-700 font-sans">
            डिजिटल मिळकत पत्रिका / आखिव पत्रिका (Digital Property Card)
          </div>
        </div>

        {/* Location & Bhu-Aadhaar Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-300 text-xs mb-4">
          <div>
            <span className="text-[11px] text-slate-500 block">जिल्हा (District)</span>
            <strong className="text-slate-800">{currentParcel.district}</strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">तालुका (Taluka)</span>
            <strong className="text-slate-800">{currentParcel.taluka}</strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">गाव / नगर (Village)</span>
            <strong className="text-slate-800">{currentParcel.village}</strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">गट / सर्व्हे क्र.</span>
            <strong className="text-slate-800">Gat {currentParcel.gatNumber} ({currentParcel.surveyNumber})</strong>
          </div>
          <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">भू-आधार ओळख क्रमांक (ULPIN):</span>
            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded border border-emerald-300">
              {currentParcel.ulpin}
            </span>
          </div>
        </div>

        {/* Land Measurement & Rights Section */}
        <div className="space-y-4 text-xs font-sans">
          
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
            <div className="p-2.5 bg-slate-100 font-bold text-slate-800 border-b border-slate-300 flex items-center justify-between">
              <span>जमीन तपशील व क्षेत्र (Parcel Dimensions)</span>
              <span className="text-[11px] font-normal text-slate-500">Tenure: {currentParcel.tenureType.replace(/_/g, ' ')}</span>
            </div>
            <div className="p-3.5 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 text-[11px] block">नोंदणीकृत क्षेत्र</span>
                <strong className="text-slate-900">{currentParcel.areaHectare} हे. {currentParcel.areaAre} आर</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">चौरस मीटर</span>
                <strong className="text-slate-900">{currentParcel.totalAreaSqm.toLocaleString()} चौ.मी.</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">जमीन वर्ग</span>
                <strong className="text-slate-900">{currentParcel.landType.replace(/_/g, ' ')}</strong>
              </div>
            </div>
          </div>

          {/* Occupants Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
            <div className="p-2.5 bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              मालक व धारक तपशील (Registered Khatedars)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-2.5">खाते क्र.</th>
                  <th className="p-2.5">धारक / मालकाचे नाव</th>
                  <th className="p-2.5">संबंध</th>
                  <th className="p-2.5">हिस्सा %</th>
                  <th className="p-2.5">स्थिती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentOwners.map(o => (
                  <tr key={o.id}>
                    <td className="p-2.5 font-mono font-bold text-emerald-800">{o.khataNumber}</td>
                    <td className="p-2.5 font-bold text-slate-900">{o.ownerName}</td>
                    <td className="p-2.5 text-slate-600">{o.relationType}</td>
                    <td className="p-2.5 font-bold text-slate-900">{o.sharePercentage}%</td>
                    <td className="p-2.5">
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Encumbrances & QR Code Validation Block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            <div className="md:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-300 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-500" />
                बोजा व इतर भार (Liabilities & Encumbrances):
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                सदर मिळकतीवर कोणतीही बँक गहाणखत किंवा शासकीय जप्ती नाही. जमीन महसूल संहिता अन्वये डिजिटल स्वाक्षरीत प्रमाणपत्र.
              </p>
              <div className="pt-2 text-[10px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>डिजिटल पडताळणी मुद्रा: {currentQR?.qrIdentifier || currentParcel.ulpin}</span>
              </div>
            </div>

            {/* Embedded QR Code */}
            <div className="p-3 bg-white border border-slate-300 rounded-xl flex flex-col items-center justify-center text-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Bhu-Aadhaar QR" className="w-24 h-24" />
              ) : (
                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                  QR Code
                </div>
              )}
              <div className="text-[10px] font-mono font-bold text-slate-800 mt-1">
                Scan to Verify
              </div>
            </div>

          </div>

          {/* Footer Signature */}
          <div className="pt-4 border-t-2 border-slate-300 flex items-end justify-between text-[11px] text-slate-600">
            <div>
              <div><strong>जारी दिनांक:</strong> {new Date().toLocaleDateString('en-IN')}</div>
              <div className="text-[10px] text-slate-400">सदर पत्रक हे प्रात्यक्षिक डिजिटल भूमी प्रणालीद्वारे निर्माण केलेले आहे.</div>
            </div>

            <div className="text-center">
              <div className="w-28 h-10 border border-dashed border-emerald-700 rounded flex items-center justify-center text-emerald-800 font-bold text-[9px] mb-1">
                Demo Seal (प्रात्यक्षिक)
              </div>
              <div className="font-bold text-slate-800">सक्षम अधिकारी (नमुना प्रात्यक्षिक)</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
