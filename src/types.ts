export enum ServiceStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  OVERDUE = "OVERDUE",
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
  // New Inspection Fields
  inspectionStartTime?: string;
  inspectionPhotosBefore?: string; // JSON array of 6 photo URLs/placeholders
  inspectionChecklistBefore?: string; // JSON object
  completionTime?: string;
  completionPhotosAfter?: string; // JSON array
  completionChecklistAfter?: string; // JSON object
  preCleaningChecklist?: string;     // JSON object for Pre-Cleaning Inspection
  status: 'IN_PROGRESS' | 'COMPLETED';
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
