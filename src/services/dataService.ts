import { 
  LandParcel, 
  OwnershipRecord, 
  CropRecord, 
  SurveyRequest, 
  MutationApplication, 
  PropertyRegistration, 
  QRCodeRecord, 
  DocumentRecord, 
  AuditLog, 
  NotificationItem, 
  UserProfile, 
  SystemSettings,
  UserRole,
  SurveyStatus,
  MutationStatus
} from '../types';

import {
  INITIAL_USER_PROFILES,
  INITIAL_LAND_PARCELS,
  INITIAL_OWNERSHIP_RECORDS,
  INITIAL_CROPS,
  INITIAL_SURVEY_REQUESTS,
  INITIAL_MUTATIONS,
  INITIAL_REGISTRATIONS,
  INITIAL_QR_CODES,
  INITIAL_DOCUMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SYSTEM_SETTINGS
} from '../data/mockData';

import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY_PREFIX = 'digital_bhoomi_v1_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading localStorage for ${key}:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving localStorage for ${key}:`, e);
  }
}

class DataService {
  private parcels: LandParcel[] = loadFromStorage('parcels', INITIAL_LAND_PARCELS);
  private ownership: OwnershipRecord[] = loadFromStorage('ownership', INITIAL_OWNERSHIP_RECORDS);
  private crops: CropRecord[] = loadFromStorage('crops', INITIAL_CROPS);
  private surveys: SurveyRequest[] = loadFromStorage('surveys', INITIAL_SURVEY_REQUESTS);
  private mutations: MutationApplication[] = loadFromStorage('mutations', INITIAL_MUTATIONS);
  private registrations: PropertyRegistration[] = loadFromStorage('registrations', INITIAL_REGISTRATIONS);
  private qrCodes: QRCodeRecord[] = loadFromStorage('qrCodes', INITIAL_QR_CODES);
  private documents: DocumentRecord[] = loadFromStorage('documents', INITIAL_DOCUMENTS);
  private notifications: NotificationItem[] = loadFromStorage('notifications', INITIAL_NOTIFICATIONS);
  private auditLogs: AuditLog[] = loadFromStorage('auditLogs', INITIAL_AUDIT_LOGS);
  private settings: SystemSettings = loadFromStorage('settings', INITIAL_SYSTEM_SETTINGS);
  private profiles: UserProfile[] = loadFromStorage('profiles', INITIAL_USER_PROFILES);
  private currentUserId: string = loadFromStorage('currentUserId', INITIAL_USER_PROFILES[0].id);

  // --- Current User & Roles ---
  getCurrentUser(): UserProfile {
    const found = this.profiles.find(p => p.id === this.currentUserId);
    return found || this.profiles[0];
  }

  setCurrentUserRole(role: UserRole): UserProfile {
    const profile = this.profiles.find(p => p.role === role) || this.profiles[0];
    this.currentUserId = profile.id;
    saveToStorage('currentUserId', this.currentUserId);
    this.logAction('USER_ROLE_SWITCH', 'User Management', { newRole: role, userName: profile.fullName });
    return profile;
  }

  getProfiles(): UserProfile[] {
    return [...this.profiles];
  }

  // --- Audit Logs ---
  logAction(action: string, module: string, details: Record<string, any> = {}): void {
    const currentUser = this.getCurrentUser();
    const newLog: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action,
      module,
      details,
      ipAddress: '127.0.0.1 (Local Verified Client)',
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
    saveToStorage('auditLogs', this.auditLogs);

    if (isSupabaseConfigured && supabase) {
      supabase.from('audit_logs').insert([{
        user_id: currentUser.id,
        user_email: currentUser.email,
        user_role: currentUser.role,
        action,
        module,
        details,
        ip_address: '127.0.0.1'
      }]).then();
    }
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // --- Notifications ---
  getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  markNotificationAsRead(id: string): void {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    saveToStorage('notifications', this.notifications);
  }

  markAllNotificationsAsRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    saveToStorage('notifications', this.notifications);
  }

  addNotification(title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT', linkUrl?: string): void {
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title,
      message,
      type,
      isRead: false,
      linkUrl,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    saveToStorage('notifications', this.notifications);
  }

  // --- Land Parcels ---
  getParcels(): LandParcel[] {
    return [...this.parcels];
  }

  getParcelById(id: string): LandParcel | undefined {
    return this.parcels.find(p => p.id === id);
  }

  getParcelByULPIN(ulpin: string): LandParcel | undefined {
    const clean = ulpin.trim().toUpperCase();
    return this.parcels.find(p => p.ulpin.toUpperCase() === clean);
  }

  getParcelByGatNumber(district: string, taluka: string, gatNumber: string): LandParcel | undefined {
    return this.parcels.find(p => 
      p.district.toLowerCase() === district.toLowerCase() &&
      p.taluka.toLowerCase() === taluka.toLowerCase() &&
      p.gatNumber.toLowerCase() === gatNumber.toLowerCase()
    );
  }

  createParcel(parcelData: Omit<LandParcel, 'id' | 'createdAt' | 'updatedAt' | 'qrCodeHash'>): LandParcel {
    const id = 'p-' + Date.now();
    
    // Generate high-entropy 64-bit random token using Web Crypto API to prevent guessability
    let secureToken = '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(8);
      window.crypto.getRandomValues(bytes);
      secureToken = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    } else {
      secureToken = Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    const qrCodeHash = `QR-BHOOMI-MH-${parcelData.district.substring(0, 3).toUpperCase()}-${parcelData.gatNumber}-${secureToken.substring(0, 8)}`;
    
    const newParcel: LandParcel = {
      ...parcelData,
      id,
      qrCodeHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.parcels.unshift(newParcel);
    saveToStorage('parcels', this.parcels);

    // Also auto-generate the corresponding active QR code record with high entropy
    const qrIdentifier = `BHOOMI-MH-${parcelData.district.substring(0,3).toUpperCase()}-${parcelData.taluka.substring(0,3).toUpperCase()}-GAT${parcelData.gatNumber}-${secureToken}`;
    const newQr: QRCodeRecord = {
      id: 'qr-' + Date.now(),
      parcelId: id,
      qrIdentifier,
      secureHash: 'sha256-' + secureToken.toLowerCase(),
      verificationUrl: `https://digitalbhoomi.maharashtra.gov.in.demo/verify/${qrIdentifier}`,
      status: 'ACTIVE',
      scansCount: 0,
      generatedAt: new Date().toISOString(),
    };
    this.qrCodes.push(newQr);
    saveToStorage('qrCodes', this.qrCodes);

    this.logAction('PARCEL_CREATED', 'Land Records', { 
      ulpin: newParcel.ulpin, 
      gat: newParcel.gatNumber, 
      village: newParcel.village, 
      district: newParcel.district 
    });

    this.addNotification(
      'New Land Parcel Enrolled',
      `Parcel Gat No ${newParcel.gatNumber} (${newParcel.village}, ${newParcel.taluka}) assigned ULPIN ${newParcel.ulpin}.`,
      'INFO',
      'records'
    );

    return newParcel;
  }

  updateParcel(id: string, updates: Partial<LandParcel>): LandParcel | null {
    const idx = this.parcels.findIndex(p => p.id === id);
    if (idx === -1) return null;

    this.parcels[idx] = {
      ...this.parcels[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage('parcels', this.parcels);

    this.logAction('PARCEL_UPDATED', 'Land Records', { id, ...updates });
    return this.parcels[idx];
  }

  // --- Ownership Records ---
  getOwnershipRecords(parcelId?: string): OwnershipRecord[] {
    if (parcelId) {
      return this.ownership.filter(o => o.parcelId === parcelId);
    }
    return [...this.ownership];
  }

  addOwnershipRecord(record: Omit<OwnershipRecord, 'id'>): OwnershipRecord {
    const newRecord: OwnershipRecord = {
      ...record,
      id: 'own-' + Date.now(),
    };
    this.ownership.push(newRecord);
    saveToStorage('ownership', this.ownership);
    this.logAction('OWNERSHIP_ADDED', 'Ownership Records', { 
      parcelId: record.parcelId, 
      ownerName: record.ownerName, 
      share: record.sharePercentage 
    });
    return newRecord;
  }

  // --- Crop Records (7/12 Extract) ---
  getCrops(parcelId?: string): CropRecord[] {
    if (parcelId) {
      return this.crops.filter(c => c.parcelId === parcelId);
    }
    return [...this.crops];
  }

  // --- Survey Requests ---
  getSurveys(): SurveyRequest[] {
    return [...this.surveys];
  }

  getSurveyById(id: string): SurveyRequest | undefined {
    return this.surveys.find(s => s.id === id);
  }

  createSurvey(surveyData: Omit<SurveyRequest, 'id' | 'surveyNumberRef' | 'createdAt' | 'updatedAt'>): SurveyRequest {
    const id = 'srv-' + Date.now();
    const surveyNumberRef = `SRV-${new Date().getFullYear()}-MH-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSurvey: SurveyRequest = {
      ...surveyData,
      id,
      surveyNumberRef,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.surveys.unshift(newSurvey);
    saveToStorage('surveys', this.surveys);

    this.logAction('SURVEY_REQUESTED', 'Survey Management', { 
      surveyRef: surveyNumberRef, 
      type: newSurvey.surveyType, 
      applicant: newSurvey.applicantName 
    });

    this.addNotification(
      'New Cadastral Survey Scheduled',
      `Survey ref ${surveyNumberRef} logged for applicant ${newSurvey.applicantName}.`,
      'INFO',
      'surveys'
    );

    return newSurvey;
  }

  updateSurveyStatus(id: string, status: SurveyStatus, fieldNotes?: string, calculatedAreaSqm?: number): SurveyRequest | null {
    const idx = this.surveys.findIndex(s => s.id === id);
    if (idx === -1) return null;

    const oldStatus = this.surveys[idx].status;
    this.surveys[idx] = {
      ...this.surveys[idx],
      status,
      fieldNotes: fieldNotes !== undefined ? fieldNotes : this.surveys[idx].fieldNotes,
      calculatedAreaSqm: calculatedAreaSqm !== undefined ? calculatedAreaSqm : this.surveys[idx].calculatedAreaSqm,
      completionDate: (status === 'FIELD_COMPLETED' || status === 'APPROVED') ? new Date().toISOString().split('T')[0] : this.surveys[idx].completionDate,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage('surveys', this.surveys);

    this.logAction('SURVEY_STATUS_CHANGED', 'Survey Management', { 
      surveyId: id, 
      from: oldStatus, 
      to: status, 
      fieldNotes 
    });

    this.addNotification(
      `Survey Status: ${status}`,
      `Survey ${this.surveys[idx].surveyNumberRef} updated from ${oldStatus} to ${status}.`,
      status === 'APPROVED' ? 'SUCCESS' : 'INFO',
      'surveys'
    );

    return this.surveys[idx];
  }

  // --- Mutations (Ferfar) ---
  getMutations(): MutationApplication[] {
    return [...this.mutations];
  }

  createMutation(mutationData: Omit<MutationApplication, 'id' | 'mutationNumber' | 'noticePublishDate' | 'noticeEndDate' | 'objectionsCount' | 'createdAt' | 'updatedAt'>): MutationApplication {
    const id = 'mut-' + Date.now();
    const mutationNumber = `FER-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + 15);

    const newMutation: MutationApplication = {
      ...mutationData,
      id,
      mutationNumber,
      noticePublishDate: now.toISOString().split('T')[0],
      noticeEndDate: end.toISOString().split('T')[0],
      objectionsCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.mutations.unshift(newMutation);
    saveToStorage('mutations', this.mutations);

    this.logAction('MUTATION_FILED', 'Verification & Approval', {
      mutationNumber,
      type: newMutation.mutationType,
      applicant: newMutation.applicantName,
    });

    this.addNotification(
      'Ferfar Application Submitted',
      `Mutation ${mutationNumber} entered 15-day public notice period.`,
      'INFO',
      'verification'
    );

    return newMutation;
  }

  reviewMutation(id: string, status: MutationStatus, officerRemarks: string): MutationApplication | null {
    const idx = this.mutations.findIndex(m => m.id === id);
    if (idx === -1) return null;

    const officer = this.getCurrentUser();
    this.mutations[idx] = {
      ...this.mutations[idx],
      status,
      officerId: officer.id,
      officerName: officer.fullName,
      officerRemarks,
      approvalTimestamp: status === 'APPROVED_BY_MANDAL_ADHIKARI' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage('mutations', this.mutations);

    this.logAction('MUTATION_REVIEWED', 'Verification & Approval', {
      mutationId: id,
      newStatus: status,
      officer: officer.fullName,
      remarks: officerRemarks,
    });

    this.addNotification(
      `Ferfar Application ${status === 'APPROVED_BY_MANDAL_ADHIKARI' ? 'Approved' : status}`,
      `Mutation ${this.mutations[idx].mutationNumber} reviewed by ${officer.fullName}.`,
      status === 'APPROVED_BY_MANDAL_ADHIKARI' ? 'SUCCESS' : 'WARNING',
      'verification'
    );

    return this.mutations[idx];
  }

  // --- Registrations ---
  getRegistrations(): PropertyRegistration[] {
    return [...this.registrations];
  }

  createRegistration(regData: Omit<PropertyRegistration, 'id' | 'tokenNumber' | 'createdAt' | 'updatedAt'>): PropertyRegistration {
    const id = 'reg-' + Date.now();
    const tokenNumber = `SRO-MH-${new Date().getFullYear()}-TK${Math.floor(100 + Math.random() * 900)}`;
    const newReg: PropertyRegistration = {
      ...regData,
      id,
      tokenNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.registrations.unshift(newReg);
    saveToStorage('registrations', this.registrations);

    this.logAction('DEED_SUBMITTED', 'Property Registration', {
      tokenNumber,
      parcelId: newReg.parcelId,
      buyer: newReg.buyerName,
      stampDuty: newReg.stampDutyPaid,
    });

    this.addNotification(
      'Registration Token Generated',
      `Token ${tokenNumber} booked at ${newReg.sroOffice} for ₹ ${newReg.stampDutyPaid.toLocaleString('en-IN')} stamp duty.`,
      'SUCCESS',
      'registration'
    );

    return newReg;
  }

  // --- QR Codes ---
  getQRCodes(): QRCodeRecord[] {
    return [...this.qrCodes];
  }

  getQRByIdentifier(identifier: string): QRCodeRecord | undefined {
    const clean = identifier.trim().toUpperCase();
    return this.qrCodes.find(q => q.qrIdentifier.toUpperCase() === clean);
  }

  getQRByParcelId(parcelId: string): QRCodeRecord | undefined {
    return this.qrCodes.find(q => q.parcelId === parcelId);
  }

  recordQRScan(identifier: string): { isValid: boolean; parcel?: LandParcel; qrRecord?: QRCodeRecord; message: string } {
    const qrRecord = this.getQRByIdentifier(identifier);
    if (!qrRecord) {
      this.logAction('QR_SCAN_FAILED', 'QR Management', { identifier, reason: 'Identifier not found in demonstration registry' });
      return { isValid: false, message: 'QR Code not found in Demonstration Registry. Please verify identifier or check enrolment.' };
    }

    if (qrRecord.status === 'REVOKED') {
      this.logAction('QR_SCAN_REVOKED', 'QR Management', { identifier, reason: 'Record has been revoked' });
      return { isValid: false, qrRecord, message: 'This QR Code identifier is REVOKED in the demonstration registry due to title dispute or cancellation.' };
    }

    if (qrRecord.status === 'INACTIVE') {
      this.logAction('QR_SCAN_INACTIVE', 'QR Management', { identifier, reason: 'Record is currently inactive' });
      return { isValid: false, qrRecord, message: 'This QR Code identifier is INACTIVE pending mutation or cadastral update.' };
    }

    // Valid: increment scans
    qrRecord.scansCount += 1;
    qrRecord.lastScannedAt = new Date().toISOString();
    saveToStorage('qrCodes', this.qrCodes);

    const parcel = this.getParcelById(qrRecord.parcelId);
    this.logAction('QR_SCANNED_SUCCESS', 'QR Management', { 
      identifier, 
      parcelId: qrRecord.parcelId, 
      ulpin: parcel?.ulpin 
    });

    return {
      isValid: true,
      parcel,
      qrRecord,
      message: 'Prototype Record Verified: Matches registered sample Bhu-Aadhaar identifier (Demonstration verification only; does not constitute legal title or ownership confirmation).'
    };
  }

  // --- Documents ---
  getDocuments(entityId?: string): DocumentRecord[] {
    if (entityId) {
      return this.documents.filter(d => d.entityId === entityId);
    }
    return [...this.documents];
  }

  uploadDocument(docData: Omit<DocumentRecord, 'id' | 'createdAt'>): DocumentRecord {
    const id = 'doc-' + Date.now();
    const newDoc: DocumentRecord = {
      ...docData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.documents.unshift(newDoc);
    saveToStorage('documents', this.documents);

    this.logAction('DOCUMENT_UPLOADED', 'Document Management', {
      docId: id,
      fileName: newDoc.fileName,
      type: newDoc.documentType,
    });

    return newDoc;
  }

  // --- Settings ---
  getSettings(): SystemSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.settings = { ...this.settings, ...updates };
    saveToStorage('settings', this.settings);
    this.logAction('SETTINGS_UPDATED', 'System Settings', updates);
    return { ...this.settings };
  }

  resetDemoData(): void {
    localStorage.clear();
    this.parcels = [...INITIAL_LAND_PARCELS];
    this.ownership = [...INITIAL_OWNERSHIP_RECORDS];
    this.crops = [...INITIAL_CROPS];
    this.surveys = [...INITIAL_SURVEY_REQUESTS];
    this.mutations = [...INITIAL_MUTATIONS];
    this.registrations = [...INITIAL_REGISTRATIONS];
    this.qrCodes = [...INITIAL_QR_CODES];
    this.documents = [...INITIAL_DOCUMENTS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.settings = { ...INITIAL_SYSTEM_SETTINGS };
    this.profiles = [...INITIAL_USER_PROFILES];
    this.currentUserId = INITIAL_USER_PROFILES[0].id;

    saveToStorage('parcels', this.parcels);
    saveToStorage('ownership', this.ownership);
    saveToStorage('crops', this.crops);
    saveToStorage('surveys', this.surveys);
    saveToStorage('mutations', this.mutations);
    saveToStorage('registrations', this.registrations);
    saveToStorage('qrCodes', this.qrCodes);
    saveToStorage('documents', this.documents);
    saveToStorage('notifications', this.notifications);
    saveToStorage('auditLogs', this.auditLogs);
    saveToStorage('settings', this.settings);
    saveToStorage('profiles', this.profiles);
    saveToStorage('currentUserId', this.currentUserId);

    this.logAction('DATABASE_RESET_DEMO', 'System Settings', { timestamp: new Date().toISOString() });
  }
}

export const dataService = new DataService();
