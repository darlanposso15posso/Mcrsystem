import { Client, ServiceRecord, User, Lead } from '../types';

export const mapClient = (c: any): Client => ({
    id: c.id,
    name: c.name,
    legalName: c.legal_name,
    dba: c.dba,
    establishmentType: c.establishment_type,
    businessHours: c.business_hours,
    address: c.address,
    city: c.city,
    state: c.state,
    zip: c.zip,
    county: c.county,
    managerName: c.manager_name,
    managerRole: c.manager_role,
    phone: c.phone,
    email: c.email,
    hoodCount: c.hood_count,
    filterCount: c.filter_count,
    ductType: c.duct_type,
    ductHeight: c.duct_height,
    roofAccess: c.roof_access,
    recurrence: c.recurrence,
    lastServiceDate: c.last_service_date,
    nextServiceDate: c.next_service_date,
    cleaningPrice: c.cleaning_price,
    lat: c.lat,
    lng: c.lng,
    createdAt: c.created_at,
    companyId: c.company_id,   // preserve for round-trips
});

/**
 * Maps a frontend Client object to a Supabase row payload.
 * companyId is REQUIRED for inserts — RLS will reject rows without it.
 */
export const unmapClient = (c: Partial<Client> & { companyId: string }): Record<string, unknown> => {
    const dateOrNull = (d?: string | null) => d || null;

    return {
        name: c.name,
        legal_name: c.legalName,
        dba: c.dba,
        establishment_type: c.establishmentType,
        business_hours: c.businessHours,
        address: c.address,
        city: c.city,
        state: c.state,
        zip: c.zip,
        county: c.county,
        manager_name: c.managerName,
        manager_role: c.managerRole,
        phone: c.phone,
        email: c.email,
        hood_count: c.hoodCount,
        filter_count: c.filterCount,
        duct_type: c.ductType,
        duct_height: c.ductHeight,
        roof_access: c.roofAccess,
        recurrence: c.recurrence,
        last_service_date: dateOrNull(c.lastServiceDate),
        next_service_date: dateOrNull(c.nextServiceDate),
        cleaning_price: (c.cleaningPrice as any) === '' ? null : Number(c.cleaningPrice),
        lat: c.lat,
        lng: c.lng,
        company_id: c.companyId,  // required for RLS
    };
};

export const mapService = (s: any): ServiceRecord => ({
    id: s.id,
    clientId: s.client_id,
    restaurantName: s.restaurant_name,
    volume: s.volume,
    systemType: s.system_type,
    conditionBefore: s.condition_before,
    servicesPerformed: s.services_performed,
    technicianName: s.technician_name,
    serviceDate: s.service_date,
    nextServiceDate: s.next_service_date,
    fireHazard: s.fire_hazard,
    nfpaCompliance: s.nfpa_compliance,
    reportNumber: s.report_number,
    notes: s.notes,
    inspectionStartTime: s.inspection_start_time,
    inspectionPhotosBefore: s.inspection_photos_before,
    inspectionChecklistBefore: s.inspection_checklist_before,
    completionTime: s.completion_time,
    completionPhotosAfter: s.completion_photos_after,
    completionChecklistAfter: s.completion_checklist_after,
    preCleaningChecklist: s.pre_cleaning_checklist,
    status: s.status,
    companyId: s.company_id,  // preserve for round-trips
});

/**
 * Maps a frontend ServiceRecord to a Supabase row payload.
 * companyId is injected at the call site for inserts.
 * For UPDATE payloads, omit companyId (RLS uses the existing row's value).
 */
export const unmapService = (s: Partial<ServiceRecord> & { companyId?: string }): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
        client_id: s.clientId,
        restaurant_name: s.restaurantName,
        volume: s.volume,
        system_type: s.systemType,
        condition_before: s.conditionBefore,
        services_performed: s.servicesPerformed,
        technician_name: s.technicianName,
        service_date: s.serviceDate || null,
        next_service_date: s.nextServiceDate || null,
        fire_hazard: s.fireHazard,
        nfpa_compliance: s.nfpaCompliance,
        report_number: s.reportNumber,
        notes: s.notes,
        inspection_start_time: s.inspectionStartTime || null,
        inspection_photos_before: s.inspectionPhotosBefore,
        inspection_checklist_before: s.inspectionChecklistBefore,
        completion_time: s.completionTime || null,
        completion_photos_after: s.completionPhotosAfter,
        completion_checklist_after: s.completionChecklistAfter,
        pre_cleaning_checklist: s.preCleaningChecklist,
        status: s.status,
    };
    // Only include company_id when explicitly provided (inserts)
    if (s.companyId !== undefined) {
        payload['company_id'] = s.companyId;
    }
    return payload;
};

export const mapProfile = (p: any): User => ({
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role,
    phone: p.phone,
    knowledgeLevel: p.knowledge_level,
    address: p.address,
    status: p.status,
    joinDate: p.created_at,
    companyId: p.company_id,
});

export const mapSetting = (s: any) => ({
    key: s.key,
    value: s.value,
});

export const mapNotification = (n: any) => ({
    id: n.id,
    message: n.message,
    isRead: n.is_read,
    createdAt: n.created_at,
});

export const mapLead = (l: any): Lead => ({
    id: l.id,
    name: l.name,
    contactName: l.contact_name,
    phone: l.phone,
    email: l.email,
    address: l.address,
    status: l.status,
    lastContactDate: l.last_contact_date,
    notes: l.notes,
    companyId: l.company_id,
    createdAt: l.created_at,
});

export const unmapLead = (l: Partial<Lead> & { companyId: string }): Record<string, unknown> => {
    return {
        name: l.name,
        contact_name: l.contactName,
        phone: l.phone,
        email: l.email,
        address: l.address,
        status: l.status,
        last_contact_date: l.lastContactDate || null,
        notes: l.notes,
        company_id: l.companyId,
    };
};
