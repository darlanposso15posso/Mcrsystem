import React, { useState, useMemo } from 'react';
import { Plus, Phone, Mail, MapPin, Calendar, MessageSquare, Edit, Trash2, Search, Filter, ArrowRight } from 'lucide-react';
import { Lead, LeadStatus } from '../../types';
import { formatDate } from '../../utils/timeUtils';

interface LeadManagementProps {
    leads: Lead[];
    isLoading: boolean;
    showLeadModal: boolean;
    setShowLeadModal: (show: boolean) => void;
    editingLead: Lead | null;
    setEditingLead: (lead: Lead | null) => void;
    handleCreateLead: (lead: Partial<Lead>) => Promise<void>;
    handleUpdateLead: (id: string | number, lead: Partial<Lead>) => Promise<void>;
    handleDeleteLead: (id: string | number) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const LeadManagement: React.FC<LeadManagementProps> = ({
    leads,
    isLoading,
    showLeadModal,
    setShowLeadModal,
    editingLead,
    setEditingLead,
    handleCreateLead,
    handleUpdateLead,
    handleDeleteLead,
    showToast
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<Partial<Lead>>({
        name: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        status: LeadStatus.NEW,
        notes: ''
    });

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchesSearch =
                lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (lead.contactName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [leads, searchTerm, statusFilter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            showToast('Nome da empresa é obrigatório', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            if (editingLead) {
                await handleUpdateLead(editingLead.id, formData);
            } else {
                await handleCreateLead(formData);
            }
            setShowLeadModal(false);
            setEditingLead(null);
            setFormData({ name: '', contactName: '', phone: '', email: '', address: '', status: LeadStatus.NEW, notes: '' });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (lead: Lead) => {
        setEditingLead(lead);
        setFormData(lead);
        setShowLeadModal(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case LeadStatus.NEW: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case LeadStatus.CONTACTED: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case LeadStatus.FOLLOW_UP: return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case LeadStatus.CONVERTED: return 'bg-blue-600/10 text-blue-600 border-blue-600/20';
            default: return 'bg-[var(--card-alt-color)] text-[var(--text-muted)] border-[var(--border-color)]';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Prospecção & CRM</h2>
                    <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Gestão de Contatos e Follow-ups</p>
                </div>
                <button
                    onClick={() => {
                        setEditingLead(null);
                        setFormData({ name: '', contactName: '', phone: '', email: '', address: '', status: LeadStatus.NEW, notes: '' });
                        setShowLeadModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 font-black text-[10px] tracking-widest uppercase transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                    <Plus size={16} /> Novo Contato
                </button>
            </div>

            {/* Filters */}
            <div className="bg-[var(--card-color)] border border-[var(--border-muted)] p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por empresa ou contato..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--card-alt-color)] border border-[var(--border-color)] p-3 pl-10 text-xs font-bold text-white placeholder:text-[var(--text-faint)] focus:outline-none focus:border-blue-500/50 transition-all uppercase tracking-wider"
                    />
                </div>
                <div className="flex gap-2">
                    {['All', ...Object.values(LeadStatus)].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === status
                                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-500'
                                    : 'bg-[var(--card-alt-color)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-muted)]'
                                }`}
                        >
                            {status === 'All' ? 'Todos' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-[var(--card-alt-color)] animate-pulse border border-[var(--border-color)]" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeads.map(lead => (
                        <div key={lead.id} className="bg-[var(--card-color)] border border-[var(--border-muted)] shadow-sm p-6 group hover:shadow-xl transition-all blue-glow-hover flex flex-col min-h-[320px]">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-[var(--card-alt-color)] border border-[var(--border-color)] flex items-center justify-center text-blue-500 font-black text-xl group-hover:scale-110 transition-all">
                                    {lead.name[0]}
                                </div>
                                <span className={`text-[9px] font-black px-3 py-1 border uppercase tracking-[0.1em] ${getStatusColor(lead.status as string)}`}>
                                    {lead.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-1">{lead.name}</h3>
                            <p className="text-[var(--text-muted)] text-xs font-bold mb-4 flex items-center gap-2">
                                <Plus size={12} className="text-blue-500" /> {lead.contactName || 'Sem nome de contato'}
                            </p>

                            <div className="space-y-3 mb-8 flex-1">
                                {lead.phone && (
                                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-medium">
                                        <Phone size={14} className="text-blue-500" /> {lead.phone}
                                    </div>
                                )}
                                {lead.email && (
                                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-medium truncate">
                                        <Mail size={14} className="text-blue-500" /> {lead.email}
                                    </div>
                                )}
                                {lead.address && (
                                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-medium truncate">
                                        <MapPin size={14} className="text-blue-500" /> {lead.address}
                                    </div>
                                )}
                                {lead.notes && (
                                    <div className="mt-4 pt-4 border-t border-[var(--border-muted)] flex gap-3 text-xs text-[var(--text-muted)] font-medium leading-relaxed italic">
                                        <MessageSquare size={14} className="shrink-0 text-blue-500/50 mt-1" />
                                        <p className="line-clamp-2">{lead.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEditModal(lead)}
                                    className="flex-1 py-3 bg-[var(--card-alt-color)] hover:bg-[var(--card-alt-color)]/80 border border-[var(--border-color)] text-white font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit size={14} /> Editar
                                </button>
                                <button
                                    onClick={() => handleDeleteLead(lead.id)}
                                    className="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredLeads.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-[var(--border-muted)]">
                            <p className="text-[var(--text-faint)] font-black uppercase tracking-[0.2em]">Nenhum contato encontrado</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showLeadModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-[#0a0a0b] border border-[var(--border-color)] p-8 max-w-2xl w-full emerald-glow shadow-2xl my-auto">
                        <h2 className="text-2xl font-black text-white italic mb-8 uppercase tracking-tight">
                            {editingLead ? 'Editar Contato' : 'Nova Prospecção'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 italic">Nome da Empresa *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-[var(--card-alt-color)] border border-[var(--border-color)] p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all uppercase tracking-wider"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 italic">Nome do Contato</label>
                                    <input
                                        type="text"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        className="w-full bg-[var(--card-alt-color)] border border-[var(--border-color)] p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all uppercase tracking-wider"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 italic">Telefone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-[var(--card-alt-color)] border border-[var(--border-color)] p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all uppercase tracking-wider"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 italic">E-mail</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[var(--card-alt-color)] border border-[var(--border-color)] p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all uppercase tracking-wider lowercase"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 italic">Endereço</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full bg-[var(--card-alt-color)] border border-[var(--border-color)] p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all uppercase tracking-wider"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 italic">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-[var(--card-alt-color)] border border-[var(--border-color)] p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all uppercase tracking-wider"
                                    >
                                        {Object.values(LeadStatus).map(status => (
                                            <option key={status} value={status} className="bg-[#0a0a0b] text-white font-bold">{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 italic">Último Contato</label>
                                    <input
                                        type="date"
                                        value={formData.lastContactDate}
                                        onChange={(e) => setFormData({ ...formData, lastContactDate: e.target.value })}
                                        className="w-full bg-[var(--card-alt-color)] border border-[var(--border-color)] p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all uppercase tracking-wider"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 italic">Anotações do Follow-up</label>
                                    <textarea
                                        rows={4}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-[var(--card-alt-color)] border border-[var(--border-color)] p-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all tracking-wider"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowLeadModal(false)}
                                    className="flex-1 py-4 bg-[var(--card-alt-color)] hover:bg-[var(--card-alt-color)]/80 border border-[var(--border-color)] text-white font-black text-[10px] tracking-widest uppercase transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] tracking-widest uppercase transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Salvando...' : (editingLead ? 'Salvar Alterações' : 'Criar Registro')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadManagement;
