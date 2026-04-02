import { useState, useCallback } from 'react';
import React from 'react';
import { Client, Recurrence } from '../types';
import { supabase } from '../lib/supabase';
import { mapClient, unmapClient } from '../lib/supabaseUtils';

const makeEmptyClient = (companyId: string) => ({
    name: '', legalName: '', dba: '', state: '', zip: '', establishmentType: '', businessHours: '',
    address: '', city: '', county: '', managerName: '', managerRole: '',
    phone: '', email: '', hoodCount: 1, filterCount: 0, ductType: 'Vertical' as const,
    ductHeight: '', roofAccess: false, recurrence: Recurrence.QUARTERLY, cleaningPrice: 0,
    companyId,
    createdAt: '',           // filled by DB
});

interface UseClientsOptions {
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    confirmAction: (msg: string, onConfirm: () => void, onCancel?: () => void) => void;
    userRole?: string;
    companyId: string;  // required — injected into all writes so RLS can validate
    onLimitReached?: () => void;  // called when client limit is hit
    maxClients?: number;          // from subscription
}

async function geocodeAddress(addressStr: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&limit=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'DE-Hood-Cleaning-App/1.0' } });
        const data = await res.json();
        if (data?.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
        return null;
    } catch {
        return null;
    }
}

function validateClient(client: Partial<Client>, userRole?: string): string | null {
    if (!client?.name?.trim()) return 'Por favor, preencha o Nome do Restaurante.';
    if (!client?.address?.trim()) return 'Por favor, preencha o Endereço Completo.';
    if (!client?.city?.trim()) return 'Por favor, preencha a Cidade.';
    if (!client?.managerName?.trim()) return 'Por favor, preencha o Gerente / Responsável.';
    if (!client?.phone?.trim()) return 'Por favor, preencha o Telefone.';
    if (!client?.email?.trim()) return 'Por favor, preencha o E-mail.';
    if (userRole === 'admin' && (client.cleaningPrice === undefined || client.cleaningPrice === null)) {
        return 'Por favor, insira o Preço da Limpeza Geral.';
    }
    return null;
}

export function useClients({ showToast, confirmAction, userRole, companyId, onLimitReached, maxClients }: UseClientsOptions) {
    const [clients, setClients] = useState<Client[]>([]);
    const [newClient, setNewClient] = useState(makeEmptyClient(companyId));
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [showClientModal, setShowClientModal] = useState(false);
    const [showEditClientModal, setShowEditClientModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showClientDetails, setShowClientDetails] = useState(false);

    const handleCreateClient = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        // ── Subscription limit check ──────────────────────────────────────────
        if (maxClients !== undefined && clients.length >= maxClients) {
            onLimitReached?.();
            return;
        }
        const error = validateClient(newClient, userRole);
        if (error) { showToast(error, 'error'); return; }
        if (!companyId) { showToast('Empresa não identificada. Faça login novamente.', 'error'); return; }

        try {
            const addressStr = `${newClient.address}, ${newClient.city}, ${newClient.state}, ${newClient.zip}`;
            const geo = await geocodeAddress(addressStr);
            const payload = unmapClient({
                ...newClient,
                companyId,
                lat: geo?.lat ?? undefined,
                lng: geo?.lng ?? undefined,
            });

            const { data, error: dbErr } = await supabase.from('clients').insert([payload]).select().single();
            if (dbErr) {
                console.error('Supabase insert error:', dbErr);
                showToast(`Erro ao salvar: ${dbErr.message}`, 'error');
                return;
            }

            if (data) {
                setClients(prev => [...prev, mapClient(data)]);
                setShowClientModal(false);
                setNewClient(makeEmptyClient(companyId));
                showToast('Cliente criado com sucesso!');
            }
        } catch (err: any) {
            console.error('Unexpected error creating client:', err);
            showToast(`Erro inesperado: ${err?.message || 'verifique o console'}`, 'error');
        }
    }, [newClient, userRole, companyId, showToast]);

    const handleUpdateClient = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;

        const error = validateClient(editingClient, userRole);
        if (error) { showToast(error, 'error'); return; }

        try {
            const addressStr = `${editingClient.address}, ${editingClient.city}, ${editingClient.state}, ${editingClient.zip}`;
            const geo = await geocodeAddress(addressStr);
            const lat = geo?.lat ?? editingClient.lat;
            const lng = geo?.lng ?? editingClient.lng;

            const { data, error: dbErr } = await supabase.from('clients')
                .update(unmapClient({ ...editingClient, companyId: editingClient.companyId, lat, lng }))
                .eq('id', editingClient.id)
                .eq('company_id', editingClient.companyId)
                .select().single();

            if (dbErr) {
                console.error('Supabase update error:', dbErr);
                showToast(`Erro ao atualizar: ${dbErr.message}`, 'error');
                return;
            }
            if (data) setClients(prev => prev.map(c => c.id === editingClient.id ? mapClient(data) : c));

            setShowEditClientModal(false);
            setEditingClient(null);
            showToast('Cliente atualizado!');
        } catch (err: any) {
            console.error('Unexpected error updating client:', err);
            showToast(`Erro inesperado: ${err?.message || 'verifique o console'}`, 'error');
        }
    }, [editingClient, userRole, showToast]);

    const handleDeleteClient = useCallback((id: string | number) => {
        confirmAction('Tem certeza que deseja apagar este cliente? Esta ação não pode ser desfeita.', async () => {
            // company_id scoping prevents IDOR — only the owning company can delete
            const { error } = await supabase.from('clients').delete().eq('id', id).eq('company_id', companyId);
            if (error) { showToast('Erro ao remover cliente', 'error'); return; }
            setClients(prev => prev.filter(c => c.id !== id));
            setShowClientDetails(false);
            setShowEditClientModal(false);
            showToast('Cliente removido com sucesso');
        });
    }, [confirmAction, showToast, companyId]);

    return {
        clients,
        setClients,
        newClient,
        setNewClient,
        editingClient,
        setEditingClient,
        showClientModal,
        setShowClientModal,
        showEditClientModal,
        setShowEditClientModal,
        selectedClient,
        setSelectedClient,
        showClientDetails,
        setShowClientDetails,
        handleCreateClient,
        handleUpdateClient,
        handleDeleteClient,
    };
}
