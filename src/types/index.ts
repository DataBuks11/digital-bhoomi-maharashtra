// Digital Bhoomi Maharashtra - Type Definitions

export type UserRole = 'ADMIN' | 'SURVEYOR' | 'VERIFICATION_OFFICER' | 'CITIZEN';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  phone: string;
  district: string;
  avatarUrl?: string;
}

export type LandType = 
  | 'AGRICULTURAL_JIRAYAT' 
  | 'AGRICULTURAL_BAGAYAT' 
  | 'NON_AGRICULTURAL_RESIDENTIAL' 
  | 'NON_AGRICULTURAL_COMMERCIAL' 
  | 'INDUSTRIAL' 
  | 'FOREST' 
  | 'GOVERNMENT_RESERVED';

export type TenureType = 
  | 'BHOGVATA_CLASS_1' 
  | 'BHOGVATA_CLASS_2' 
  | 'GOVERNMENT_LEASE' 
  | 'INAM_CLASS';

export type ParcelStatus = 
  | 'DRAFT' 
  | 'PENDING_SURVEY' 
  | 'PENDING_VERIFICATION' 
  | 'VERIFIED' 
  | 'IN_DISPUTE' 
  | 'MUTATION_IN_PROGRESS' 
  | 'ARCHIVED';

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface LandParcel {
  id: string;
  ulpin: string; // Unique Land Parcel Identification Number (Bhu-Aadhaar)
  district: string;
  taluka: string;
  village: string;
  gatNumber: string;
  surveyNumber: string;
  subDivision: string;
  totalAreaSqm: number;
  areaHectare: number;
  areaAre: number;
  potKharabaSqm: number;
  landType: LandType;
  tenureType: TenureType;
  assessmentTax: number;
  status: ParcelStatus;
  boundaryCoordinates: GeoPoint[];
  qrCodeHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface OwnershipRecord {
  id: string;
  parcelId: string;
  ownerName: string;
  relationType: 'SELF' | 'SON_OF' | 'WIFE_OF' | 'LEGAL_HEIR' | 'JOINT_HOLDER';
  guardianName?: string;
  aadhaarMasked: string; // e.g. XXXX-XXXX-4192
  sharePercentage: number;
  khataNumber: string;
  entryDate: string;
  mutationNumber?: string;
  isPrimary: boolean;
  status: 'ACTIVE' | 'TRANSFERRED' | 'DISPUTED';
}

export interface CropRecord {
  id: string;
  parcelId: string;
  year: string;
  season: 'KHARIF' | 'RABI' | 'SUMMER' | 'PERENNIAL';
  cropName: string;
  cropMarathiName: string;
  irrigatedAreaHectares: number;
  unirrigatedAreaHectares: number;
  waterSource: string;
}

export type SurveyType = 
  | 'REGULAR_MEASUREMENT' 
  | 'URGENT_TATKAL' 
  | 'COURT_COMMISSION' 
  | 'SUB_DIVISION_PARTITION' 
  | 'BOUNDARY_DEMARCATION';

export type SurveyStatus = 
  | 'REQUESTED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'FIELD_COMPLETED' 
  | 'APPROVED' 
  | 'REVISION_REQUIRED' 
  | 'REJECTED';

export interface SurveyRequest {
  id: string;
  surveyNumberRef: string;
  parcelId: string;
  applicantName: string;
  applicantContact: string;
  surveyType: SurveyType;
  surveyorId?: string;
  surveyorName?: string;
  scheduledDate?: string;
  completionDate?: string;
  status: SurveyStatus;
  gpsCoordinates?: GeoPoint[];
  calculatedAreaSqm?: number;
  fieldNotes?: string;
  disputeFlag: boolean;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type MutationType = 
  | 'INHERITANCE_VARAS' 
  | 'SALE_DEED_KHARIDI' 
  | 'GIFT_DEED_BAKSHIS' 
  | 'PARTITION_VATAP' 
  | 'BANK_LOAN_BOJHA' 
  | 'MORTGAGE_RELEASE';

export type MutationStatus = 
  | 'PENDING_TALATHI_REVIEW' 
  | 'NOTICE_PERIOD' 
  | 'CORRECTION_REQUESTED' 
  | 'APPROVED_BY_MANDAL_ADHIKARI' 
  | 'REJECTED' 
  | 'CANCELLED';

export interface MutationApplication {
  id: string;
  mutationNumber: string; // e.g. FER-2024-00892
  parcelId: string;
  mutationType: MutationType;
  applicantName: string;
  transferorNames: string[];
  transfereeNames: string[];
  noticePublishDate: string;
  noticeEndDate: string;
  objectionsCount: number;
  status: MutationStatus;
  officerId?: string;
  officerName?: string;
  officerRemarks?: string;
  approvalTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}

export type RegistrationStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'FEES_PAID' 
  | 'APPOINTMENT_SCHEDULED' 
  | 'REGISTERED' 
  | 'REJECTED';

export interface PropertyRegistration {
  id: string;
  tokenNumber: string;
  parcelId: string;
  sellerName: string;
  buyerName: string;
  marketValuation: number;
  considerationAmount: number;
  stampDutyPaid: number;
  registrationFee: number;
  sroOffice: string;
  appointmentDate?: string;
  appointmentSlot?: string;
  status: RegistrationStatus;
  deedNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeRecord {
  id: string;
  parcelId: string;
  qrIdentifier: string; // e.g. BHOOMI-MH-PUN-HAV-00918
  secureHash: string;
  verificationUrl: string;
  status: 'ACTIVE' | 'INACTIVE' | 'REVOKED';
  scansCount: number;
  lastScannedAt?: string;
  generatedAt: string;
}

export type DocumentType = 
  | 'EXTRACT_7_12' 
  | 'FORM_8A' 
  | 'SALE_DEED' 
  | 'CADASTRAL_MAP_TIPAN' 
  | 'SURVEY_REPORT' 
  | 'IDENTITY_PROOF' 
  | 'TAX_RECEIPT' 
  | 'AFFIDAVIT';

export interface DocumentRecord {
  id: string;
  entityType: 'PARCEL' | 'SURVEY' | 'MUTATION' | 'REGISTRATION';
  entityId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSizeKb: number;
  mimeType: string;
  uploadedByName: string;
  isVerified: boolean;
  fileHash?: string; // Real SHA-256 cryptographic digest
  fileData?: string; // Base64 data URL for direct client-side preview & download
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  module: string;
  details: Record<string, any>;
  ipAddress: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface SystemSettings {
  portalName: string;
  disclaimerWatermark: boolean;
  maintenanceMode: boolean;
  defaultStampDutyRate: number; // 0.06 (6%)
  sroOfficesActive: string[];
}
