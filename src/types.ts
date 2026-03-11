export enum ServiceStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  OVERDUE = "OVERDUE",
}

export enum LeadStatus {
  NEW = "New",
  CONTACTED = "Contacted",
  FOLLOW_UP = "Follow-up",
  CONVERTED = "Converted",
}

export enum Recurrence {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  SEMI_ANNUAL = "SEMI_ANNUAL",
  ANNUAL = "ANNUAL"
}

export interface User {
  id: string | number;
  email: string;
  name: string;
  role: 'admin' | 'technician';
  companyId?: string;
  phone?: string;
  knowledgeLevel?: string;
  address?: string;
  joinDate?: string;
  status?: 'active' | 'pending';
}

export interface Client {
  id: string | number;
  name: string;
  legalName?: string;
  dba?: string;
  establishmentType?: string;
  businessHours?: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  county?: string;
  managerName: string;
  managerRole?: string;
  phone: string;
  email: string;
  hoodCount?: number;
  filterCount?: number;
  ductType?: 'Horizontal' | 'Vertical' | 'Both';
  ductHeight?: string;
  roofAccess?: boolean;
  recurrence: Recurrence;
  lastServiceDate?: string;
  nextServiceDate?: string;
  createdAt: string;
  cleaningPrice?: number;
  lat?: number;
  lng?: number;
  companyId: string;  // required — enforced by RLS
}

export interface ServiceRecord {
  id: string | number;
  clientId: string | number;
  restaurantName?: string;
  volume: "Low" | "Medium" | "High";
  systemType: string;
  conditionBefore: "Light" | "Moderate" | "Heavy";
  servicesPerformed: string;
  technicianName: string;
  serviceDate: string;
  nextServiceDate: string;
  fireHazard: boolean;
  nfpaCompliance: boolean;
  reportNumber: string;
  notes?: string;
  inspectionStartTime?: string;
  inspectionPhotosBefore?: string;
  inspectionChecklistBefore?: string;
  completionTime?: string;
  completionPhotosAfter?: string;
  completionChecklistAfter?: string;
  preCleaningChecklist?: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  companyId?: string;  // present after fetch, injected on insert
}

export interface DashboardStats {
  activeClients: number;
  servicesThisMonth: number;
  completedServicesTotal?: number;
  overdueServices: number;
  estimatedRevenue: number;
  nfpaRate?: number;
  establishmentCounts?: { name: string; value: number }[];
  monthlyTrends?: { name: string; total: number }[];
}

export interface Lead {
  id: string | number;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: LeadStatus | string;
  lastContactDate?: string;
  notes?: string;
  companyId: string;
  createdAt: string;
}
