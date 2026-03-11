import { useState, useCallback, useRef } from 'react';
import { ServiceRecord, Recurrence, Client } from '../types';
import { supabase } from '../lib/supabase';
import { mapService, unmapService, mapClient } from '../lib/supabaseUtils';

export interface CompletionChecklist {
    polished: boolean;
    floorsCleaned: boolean;
    filtersInstalled: boolean;
    systemTested: boolean;
    stickersApplied: boolean;
}

const DEFAULT_COMPLETION_CHECKLIST: CompletionChecklist = {
    polished: false,
    floorsCleaned: false,
    filtersInstalled: false,
    systemTested: false,
    stickersApplied: false,
};

interface UseActiveServiceOptions {
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    confirmAction: (msg: string, onConfirm: () => void, onCancel?: () => void) => void;
    onServiceCompleted?: (updatedService: ServiceRecord, updatedClient?: Client) => void;
    onServiceCancelled?: (serviceId: string | number) => void;
    clients: Client[];
}

export function useActiveService({
    showToast,
    confirmAction,
    onServiceCompleted,
    onServiceCancelled,
    clients,
}: UseActiveServiceOptions) {
    const [activeService, setActiveService] = useState<ServiceRecord | null>(null);
    const [preCleaningChecklistData, setPreCleaningChecklistData] = useState<Record<string, boolean>>({});
    const [completionChecklist, setCompletionChecklist] = useState<CompletionChecklist>(DEFAULT_COMPLETION_CHECKLIST);
    const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([]);
    const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);

    // Photo upload state — per-photo loading and error tracking
    const [photoLoadingStates, setPhotoLoadingStates] = useState<Record<string, boolean>>({});
    const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({});

    // Debounce timer ref for auto-save
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** Load an in-progress service into state (called after data fetch / on resume) */
    const loadActiveService = useCallback((srv: ServiceRecord | null) => {
        if (!srv) {
            setActiveService(null);
            setInspectionPhotos([]);
            setCompletionPhotos([]);
            setPreCleaningChecklistData({});
            setCompletionChecklist(DEFAULT_COMPLETION_CHECKLIST);
            return;
        }

        setActiveService(srv);

        if (srv.inspectionPhotosBefore) {
            try {
                const photos = typeof srv.inspectionPhotosBefore === 'string'
                    ? JSON.parse(srv.inspectionPhotosBefore)
                    : srv.inspectionPhotosBefore;
                setInspectionPhotos(Array.isArray(photos) ? photos : []);
            } catch { setInspectionPhotos([]); }
        }

        if (srv.completionPhotosAfter) {
            try {
                const photos = typeof srv.completionPhotosAfter === 'string'
                    ? JSON.parse(srv.completionPhotosAfter)
                    : srv.completionPhotosAfter;
                setCompletionPhotos(Array.isArray(photos) ? photos : []);
            } catch { setCompletionPhotos([]); }
        }

        if (srv.preCleaningChecklist) {
            try {
                setPreCleaningChecklistData(JSON.parse(srv.preCleaningChecklist));
            } catch { setPreCleaningChecklistData({}); }
        }
    }, []);

    /** Auto-persist progress to Supabase (debounced, non-blocking) */
    const persistProgress = useCallback((serviceId: string | number, patch: Record<string, unknown>) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            const { error } = await supabase.from('services').update(patch).eq('id', serviceId);
            if (error) console.error('[useActiveService] Auto-save failed:', error);
        }, 1500); // 1.5s debounce
    }, []);

    /** Update pre-cleaning checklist and auto-save */
    const updatePreCleaningChecklist = useCallback((data: Record<string, boolean>) => {
        setPreCleaningChecklistData(data);
        if (activeService?.id) {
            persistProgress(activeService.id, {
                pre_cleaning_checklist: JSON.stringify(data),
            });
        }
    }, [activeService?.id, persistProgress]);

    /** Update completion checklist */
    const updateCompletionChecklist = useCallback((data: CompletionChecklist) => {
        setCompletionChecklist(data);
    }, []);

    /** Upload a single inspection photo (with per-photo loading state) */
    const addInspectionPhoto = useCallback(async (base64: string, slot: number) => {
        const key = `inspection_${slot}`;
        setPhotoLoadingStates(prev => ({ ...prev, [key]: true }));
        setPhotoErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
        try {
            const { uploadImage } = await import('../utils/storageUtils');
            const publicUrl = await uploadImage(base64);
            setInspectionPhotos(prev => {
                const updated = [...prev];
                updated[slot] = publicUrl;
                if (activeService?.id) {
                    persistProgress(activeService.id, { inspection_photos_before: JSON.stringify(updated) });
                }
                return updated;
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setPhotoErrors(prev => ({ ...prev, [key]: msg }));
            showToast(`Erro ao enviar foto ${slot + 1}: ${msg}`, 'error');
        } finally {
            setPhotoLoadingStates(prev => { const n = { ...prev }; delete n[key]; return n; });
        }
    }, [activeService?.id, persistProgress, showToast]);

    /** Upload a single completion photo */
    const addCompletionPhoto = useCallback(async (base64: string, slot: number) => {
        const key = `completion_${slot}`;
        setPhotoLoadingStates(prev => ({ ...prev, [key]: true }));
        setPhotoErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
        try {
            const { uploadImage } = await import('../utils/storageUtils');
            const publicUrl = await uploadImage(base64);
            setCompletionPhotos(prev => {
                const updated = [...prev];
                updated[slot] = publicUrl;
                if (activeService?.id) {
                    persistProgress(activeService.id, { completion_photos_after: JSON.stringify(updated) });
                }
                return updated;
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setPhotoErrors(prev => ({ ...prev, [key]: msg }));
            showToast(`Erro ao enviar foto ${slot + 1}: ${msg}`, 'error');
        } finally {
            setPhotoLoadingStates(prev => { const n = { ...prev }; delete n[key]; return n; });
        }
    }, [activeService?.id, persistProgress, showToast]);

    /** Remove a photo from a slot */
    const removePhoto = useCallback((type: 'inspection' | 'completion', slot: number) => {
        if (type === 'inspection') {
            setInspectionPhotos(prev => {
                const updated = [...prev];
                updated[slot] = '';
                return updated;
            });
        } else {
            setCompletionPhotos(prev => {
                const updated = [...prev];
                updated[slot] = '';
                return updated;
            });
        }
    }, []);

    /** Cancel an in-progress service */
    const cancelService = useCallback(() => {
        if (!activeService) return;
        confirmAction(
            'Certeza que deseja cancelar este serviço? O administrador será notificado.',
            async () => {
                const { error } = await supabase.from('services').delete().eq('id', activeService.id);
                if (!error) {
                    onServiceCancelled?.(activeService.id);
                    setActiveService(null);
                    setInspectionPhotos([]);
                    setCompletionPhotos([]);
                    setPreCleaningChecklistData({});
                    setCompletionChecklist(DEFAULT_COMPLETION_CHECKLIST);
                    showToast('Serviço cancelado');
                } else {
                    showToast('Erro ao cancelar o serviço', 'error');
                }
            }
        );
    }, [activeService, confirmAction, onServiceCancelled, showToast]);

    /** Complete an in-progress service */
    const completeService = useCallback(async (overrides: {
        fireHazard: boolean;
        nfpaCompliance: boolean;
        notes: string;
        nextServiceDate: string;
    }) => {
        if (!activeService) return;
        try {
            const payload = unmapService({
                status: 'COMPLETED',
                serviceDate: new Date().toISOString().split('T')[0],
                completionTime: new Date().toISOString(),
                completionChecklistAfter: completionChecklist as any,
                completionPhotosAfter: completionPhotos as any,
                fireHazard: overrides.fireHazard,
                nfpaCompliance: overrides.nfpaCompliance,
                notes: overrides.notes,
                nextServiceDate: overrides.nextServiceDate,
                preCleaningChecklist: JSON.stringify(preCleaningChecklistData) as any,
            });
            Object.keys(payload).forEach(k => (payload as any)[k] === undefined && delete (payload as any)[k]);

            const client = clients.find(c => c.id === activeService.clientId);
            const today = new Date();
            let nextDate = new Date(today);

            if (client) {
                if (client.recurrence === Recurrence.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
                else if (client.recurrence === Recurrence.QUARTERLY) nextDate.setMonth(nextDate.getMonth() + 3);
                else if (client.recurrence === Recurrence.SEMI_ANNUAL || (client.recurrence as string) === 'SEMI-ANNUAL') nextDate.setMonth(nextDate.getMonth() + 6);
                else if (client.recurrence === Recurrence.ANNUAL) nextDate.setFullYear(nextDate.getFullYear() + 1);
            }

            const [srvRes, cliRes] = await Promise.all([
                supabase.from('services').update(payload).eq('id', activeService.id).select().single() as unknown as Promise<any>,
                client
                    ? supabase.from('clients').update({ last_service_date: today.toISOString(), next_service_date: nextDate.toISOString() }).eq('id', client.id).select().single() as unknown as Promise<any>
                    : Promise.resolve({ data: null, error: null }),
            ]);

            if (!srvRes.error) {
                const completedService = srvRes.data ? mapService(srvRes.data) : activeService;
                const updatedClient = cliRes.data ? mapClient(cliRes.data) : undefined;

                onServiceCompleted?.(completedService, updatedClient);

                // Non-blocking email report
                if (client?.email) {
                    supabase.functions.invoke('send-report', {
                        body: {
                            clientEmail: client.email,
                            restaurantName: activeService.restaurantName ?? 'Estabelecimento',
                            pdfUrl: `https://dehoodcleaning.com/report/${activeService.id}`,
                            serviceDate: today.toISOString(),
                        },
                    }).catch(err => console.error('Error sending email:', err));
                }

                setActiveService(null);
                setCompletionPhotos([]);
                setCompletionChecklist(DEFAULT_COMPLETION_CHECKLIST);
                setPreCleaningChecklistData({});
                showToast('Relatório finalizado com sucesso!');
            } else {
                showToast('Erro ao enviar o relatório', 'error');
            }
        } catch {
            showToast('Erro de conexão ao finalizar', 'error');
        }
    }, [activeService, completionChecklist, completionPhotos, preCleaningChecklistData, clients, onServiceCompleted, showToast]);

    return {
        activeService,
        setActiveService,
        loadActiveService,
        preCleaningChecklistData,
        updatePreCleaningChecklist,
        setPreCleaningChecklistData,
        completionChecklist,
        updateCompletionChecklist,
        setCompletionChecklist,
        inspectionPhotos,
        setInspectionPhotos,
        completionPhotos,
        setCompletionPhotos,
        photoLoadingStates,
        photoErrors,
        addInspectionPhoto,
        addCompletionPhoto,
        removePhoto,
        cancelService,
        completeService,
    };
}
