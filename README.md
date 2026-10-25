# Digital Bhoomi Maharashtra (डिजिटल भूमी महाराष्ट्र)
### Advanced Land Records, Cadastral Survey & QR Verification Prototype

> [!NOTE]
> **Demonstration Disclaimer:** Digital Bhoomi Maharashtra is an interactive conceptual prototype and demonstration system. It is not an official government portal. All cadastral survey numbers, ULPIN codes, citizen names, khata numbers, and stamps are fictional sample demonstrations for Maharashtra, India.

---

## 🏛️ System Overview

**Digital Bhoomi Maharashtra** is an interactive full-stack prototype modernizing land records management, cadastral survey operations, unique property identification (Bhu-Aadhaar / ULPIN), QR-based record lookup, ownership record management (7/12 extracts, Form 8A, Ferfar/Mutation register), and verification workflows across Maharashtra.

---

## 📦 Implemented Modules (14/14 Modules Complete)

| # | Module | Core Functionality & Features |
|---|---|---|
| 1 | **Executive Dashboard** | Real-time state KPIs (Parcels, Active Surveys, Ferfar Queue, Cadastral Area, Stamp Duty Collected), land classification charts, district distribution, and quick action hubs. |
| 2 | **7/12 Land Records Repository** | Searchable & filterable table by District, Taluka, Village, Gat No, ULPIN; "Enroll New Parcel" modal with automatic ULPIN generation; Official Maharashtra 7/12 (Saat Bara) extract viewer (Gaon Namuna 7, Gaon Namuna 12 crop details, Form 8A ledger). |
| 3 | **Interactive Land Map** | Leaflet & OpenStreetMap GIS layer with polygon boundaries across Pune, Nagpur, Nashik, Sambhaji Nagar, and Thane; interactive click-to-inspect popup cards; interactive polygon measurement tool calculating perimeter and area (sq. meters & gunthas). |
| 4 | **Land Survey Management (Mojani)** | Cadastral survey booking, status lifecycle (`REQUESTED` → `ASSIGNED` → `IN_PROGRESS` → `FIELD_COMPLETED` → `APPROVED`), Total Station GPS coordinates, surveyor field notes, boundary disputes flags, and official PDF Survey Report export. |
| 5 | **QR Bhu-Aadhaar Engine** | Cryptographic QR generator with Maharashtra Government watermark; dual-mode QR scanner supporting live webcam camera scanning (`html5-qrcode`), document image file upload, and manual ULPIN fallback; active/inactive/revoked status validation. |
| 6 | **Ownership & Khatedar Registry** | Multi-owner joint khatedar management with share percentages (e.g. 50%, 25%, 25%), relation types, masked Aadhaar reference; Gaon Namuna 6 mutation register overview. |
| 7 | **Verification & Approval Queue** | Talathi / Mandal Adhikari / Tehsildar judicial inbox; 4-point statutory inspection checklist (title chain, SRO Index-II, Mojani conformity, 15-day notice expiry); 3-way decision workflow (Approve with digital seal, Request Correction, Reject). |
| 8 | **Property Registration Workflow** | 4-step Sub-Registrar Office (SRO) deed registration wizard: Party details, Ready Reckoner market valuation calculation, Stamp duty (6%) & fee calculation, e-Challan GRAS payment simulation, and SRO appointment token booking. |
| 9 | **Digital Property Cards** | Official Maharashtra Malmatta Patrak (Akhiv Patrika) format with Ashok Stambh emblem, ULPIN badge, CTS number, area, registered occupants, encumbrances, embedded QR code, and instant high-fidelity PDF export via jsPDF. |
| 10 | **Document Vault (Abhilekh)** | Centralized repository for 7/12 extracts, Form 8A, registered sale deeds, cadastral Tipan maps, and survey reports; categorized filtering, document metadata, SHA-256 integrity status, and simulated Supabase Storage. |
| 11 | **Reports & Analytics** | Interactive analytics powered by Recharts (monthly stamp duty collections, district volume, land classification donut, survey lifecycle funnel); filtered CSV land records export; state cadastral summary PDF generator. |
| 12 | **User & Role Management (RBAC)** | Multi-persona support (Super Admin, Cadastral Surveyor, Verification Officer, Citizen); directory of system accounts; granular permission policy matrix; instant role switcher. |
| 13 | **Audit Logs & Notifications** | Immutable government audit trail recording actor, role, action, module, timestamp, IP address, and details JSON; live notification center with unread badges and direct record navigation. |
| 14 | **System Settings & Demo Engine** | Configurable portal title, demonstration watermark toggle, maintenance mode simulation, Ready Reckoner base rates, SRO active offices management, and one-click "Reset to Demo Baseline" button. |

---

## 🛠️ Technology Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS + custom government theme variables (Ashoka Lion / Tricolor subtle accents, Emerald / Slate / Gold theme, dark & light mode support, accessible high-contrast tables).
- **Icons**: Lucide React
- **Mapping & GIS**: Leaflet, OpenStreetMap
- **QR Code Engine**: `qrcode`, `html5-qrcode`
- **Charts & Visualizations**: Recharts
- **PDF Generation**: jsPDF
- **Backend & Database**:
  - PostgreSQL schema with Row Level Security (RLS)
  - Supabase client (Database, Auth, Storage)
  - Built-in Local Storage persistent offline demonstration engine (100% functional out-of-the-box without requiring live cloud credentials)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v22 recommended)
- **npm**: v9.0.0 or higher

### 2. Installation
```bash
# Clone the repository and navigate to the project directory
cd QORVEX_VGIL_SyncAI_MCP_MVP

# Install all dependencies
npm install
```

### 3. Run Locally (Development Server)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Database Setup (Supabase & PostgreSQL)

The prototype works **100% offline out-of-the-box** using browser local storage persistence. To connect to a live Supabase PostgreSQL backend:

### 1. Execute SQL Migrations
Open your Supabase Project Dashboard → **SQL Editor**, and execute the migration script located at:
```
supabase/migrations/001_initial_schema.sql
```
This script creates:
- `profiles`, `land_parcels`, `ownership_records`, `survey_requests`, `mutations`, `registrations`, `qr_codes`, `documents`, `notifications`, `audit_logs`, and `system_settings` tables.
- Foreign keys, B-tree indexes, and updated timestamp triggers.
- Row Level Security (RLS) policies allowing public demonstration read/write operations.

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Supabase Configuration (Optional - leave empty for offline demo mode)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🧪 Testing Critical Workflows

The following 10 end-to-end workflows have been tested and verified:
1. **Create a Land Parcel**: Navigate to *7/12 & Land Records* → Click *Enroll New Land Parcel* → Enter Gat No, Village, Owner → Submit → Observe automatic ULPIN assignment.
2. **Generate QR Code**: Navigate to *QR Bhu-Aadhaar Engine* → Select *Generate & Print* → View generated QR with Gov seal and watermark certificate.
3. **Scan QR Code**: Switch to *Scan & Verify* → Click *Test Active (Gat 142)* or point camera at a QR code → Verify *Authentic Record Verified* response.
4. **Inspect Land Record**: Click *Open Full 7/12 Extract* from the verification findings or click any row in the Land Records table.
5. **Create Survey Request**: Navigate to *Survey Management (Mojani)* → Click *Book Mojani Survey* → Select Gat, applicant name, and preferred date.
6. **Update Survey Status**: Click *Update* on any survey in the queue → Change status (`IN_PROGRESS` / `FIELD_COMPLETED`) → Add field notes and area → Save.
7. **Submit Verification**: In *Ownership & Khatedars*, view existing mutations or file a new Ferfar application.
8. **Officer Review**: Navigate to *Verification & Ferfar Approval* → Click *Review Case* → Check statutory items → Enter remarks → Click *Approve & Sign Ferfar*.
9. **Generate Digital Property Card**: Navigate to *Digital Property Cards* → Select parcel → View the official Malmatta Patrak card → Click *Download PDF Card*.
10. **Export Report**: Navigate to *Reports & Analytics* → Click *Export Filtered CSV* or *State Audit PDF*.

---

## 🔐 Security & Role-Based Access Control (RBAC)

The portal supports 4 operational roles:
- **Super Admin**: Complete master configuration, user administration, and system audit log inspection.
- **Verification Officer / Talathi / Tehsildar**: Review statutory 15-day notice periods, verify SRO Index-II deeds, and digitally approve/reject Ferfar mutations.
- **Cadastral Surveyor**: Manage field measurement queues, record Total Station GPS demarcations, and file boundary dispute notices.
- **Citizen / Khatedar**: Public search, digital 7/12 extract inspection, Malmatta Patrak card downloads, and SRO appointment token booking.

You can switch personas at any time using the **Role Switcher** in the top navigation bar.

---

## 📄 License & Disclaimer

This project is created for demonstration and educational purposes. Not an official Government of Maharashtra software application.
