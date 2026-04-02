import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Lead, LeadStatus } from '../types';
import { mapLead, unmapLead } from '../lib/supabaseUtils';

interface UseLeadsProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    confirmAction: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
    companyId: string;
}

export const useLeads = ({ showToast, confirmAction, companyId }: UseLeadsProps) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);

    const fetchLeads = useCallback(async () => {
        if (!companyId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data.map(mapLead));
        } catch (err) {
            console.error('Error fetching leads:', err);
            showToast('Erro ao carregar leads', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [companyId, showToast]);

    const handleCreateLead = async (leadData: Partial<Lead>) => {
        if (!companyId) return;
        try {
            const payload = unmapLead({ ...leadData, companyId });
            const { data, error } = await supabase
                .from('leads')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;
            setLeads(prev => [mapLead(data), ...prev]);
            showToast('Lead criado com sucesso', 'success');
            setShowLeadModal(false);
        } catch (err) {
            console.error('Error creating lead:', err);
            showToast('Erro ao criar lead', 'error');
        }
    };

    const handleUpdateLead = async (id: string | number, leadData: Partial<Lead>) => {
        try {
            const payload = unmapLead({ ...leadData, companyId });
            const { data, error } = await supabase
                .from('leads')
                .update(payload)
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;
            setLeads(prev => prev.map(l => l.id === id ? mapLead(data) : l));
            showToast('Lead atualizado com sucesso', 'success');
            setEditingLead(null);
        } catch (err) {
            console.error('Error updating lead:', err);
            showToast('Erro ao atualizar lead', 'error');
        }
    };

    const handleDeleteLead = (id: string | number) => {
        confirmAction('Tem certeza que deseja excluir esta prospecção?', async () => {
            try {
                // company_id scoping prevents IDOR
                const { error } = await supabase.from('leads').delete().eq('id', id).eq('company_id', companyId);
                if (error) throw error;
                setLeads(prev => prev.filter(l => l.id !== id));
                showToast('Lead excluído com sucesso', 'success');
            } catch (err) {
                console.error('Error deleting lead:', err);
                showToast('Erro ao excluir lead', 'error');
            }
        });
    };

    return {
        leads,
        setLeads,
        fetchLeads,
        isLoading,
        showLeadModal,
        setShowLeadModal,
        editingLead,
        setEditingLead,
        handleCreateLead,
        handleUpdateLead,
        handleDeleteLead,
    };
};
