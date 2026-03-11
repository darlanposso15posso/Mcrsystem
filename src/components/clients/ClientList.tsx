import React from 'react';
import { Plus, MapPin, ShieldCheck, CheckCircle2, Clock, Edit, Trash2 } from 'lucide-react';
import { Client } from '../../types';
import { formatDate } from '../../utils/timeUtils';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

interface ClientListProps {
    user: any;
    filteredClients: Client[];
    setShowClientModal: (show: boolean) => void;
    setSelectedClient: (client: Client) => void;
    setShowClientDetails: (show: boolean) => void;
    setEditingClient: (client: Client) => void;
    setShowEditClientModal: (show: boolean) => void;
    setSelectedClientId: (id: string | number) => void;
    setShowServiceModal: (show: boolean) => void;
    handleDeleteClient: (id: string | number) => void;
    settings?: Record<string, string>;
    segmentLabels?: SegmentLabels;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    confirmAction: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const ClientList: React.FC<ClientListProps> = ({
    user,
    filteredClients,
    setShowClientModal,
    setSelectedClient,
    setShowClientDetails,
    setEditingClient,
    setShowEditClientModal,
    setSelectedClientId,
    setShowServiceModal,
    handleDeleteClient,
    settings = {},
    segmentLabels,
    showToast,
    confirmAction
}) => {
    const currentLang = (settings['language'] as Language) || 'pt';
    const t = translations[currentLang];
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                    {segmentLabels ? `Gestão de ${segmentLabels.clients}` : (currentLang === 'pt' ? 'Gestão de Clientes' : 'Client Management')}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map(client => (
                    <div key={client.id}>
                        {/* Mobile Optimized Card */}
                        <div className="md:hidden bg-[var(--card-color)] rounded-none border border-[var(--border-muted)] shadow-sm overflow-hidden flex flex-col emerald-glow-hover transition-all">
                            <div
                                className="p-4 flex items-center gap-4 cursor-pointer active:bg-[var(--card-alt-color)] transition-colors"
                                onClick={() => {
                                    setSelectedClient(client);
                                    setShowClientDetails(true);
                                }}
                            >
                                <div className="w-12 h-12 shrink-0 bg-emerald-500/10 rounded-none border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-xl shadow-sm">
                                    {client.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-base truncate text-white uppercase tracking-tight">{client.name}</h3>
                                    <div className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-1 mt-0.5 font-bold uppercase tracking-widest">
                                        <MapPin size={12} className="text-emerald-500" /> {client.city}
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    {client.nextServiceDate ? (
                                        <div className="bg-emerald-500/10 px-2 py-1 rounded-none border border-emerald-500/20">
                                            <div className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Próxima</div>
                                            <div className="text-xs font-black text-emerald-500">{formatDate(client.nextServiceDate).substring(0, 5)}</div>
                                        </div>
                                    ) : (
                                        <div className="bg-[var(--card-alt-color)] px-2 py-1 rounded-none border border-[var(--border-color)]">
                                            <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{client.recurrence}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Action Bar */}
                            <div className="px-4 pb-4 pt-1 flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedClient(client);
                                        setShowClientDetails(true);
                                    }}
                                    className="flex-1 py-3 bg-black/5 text-black rounded-none text-xs font-bold active:scale-95 transition-all text-center"
                                >
                                    Ver Detalhes
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedClientId(client.id);
                                        setShowServiceModal(true);
                                    }}
                                    className="flex-[1.5] py-3 bg-emerald-500 text-white rounded-none text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} />
                                    {segmentLabels ? `Iniciar ${segmentLabels.service}` : (currentLang === 'pt' ? 'Iniciar Limpeza' : 'Start Service')}
                                </button>
                                {user.role === 'admin' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingClient(client);
                                                setShowEditClientModal(true);
                                            }}
                                            className="p-3 bg-amber-50 text-amber-600 rounded-none active:scale-95 transition-all"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Desktop Detailed View */}
                        <div className="hidden md:block bg-[var(--card-color)] p-6 rounded-none border border-[var(--border-muted)] shadow-sm hover:shadow-xl transition-all emerald-glow-hover group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-[var(--card-alt-color)] border border-[var(--border-color)] rounded-none flex items-center justify-center text-emerald-500 font-black text-xl emerald-glow transition-all group-hover:scale-110">
                                    {client.name[0]}
                                </div>
                                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-none uppercase tracking-widest border border-emerald-500/20">
                                    {client.recurrence}
                                </span>
                            </div>
                            <h3 className="font-black text-xl mb-1 text-white uppercase tracking-tight">{client.name}</h3>
                            {client.establishmentType && (
                                <div className="inline-block px-3 py-1 bg-[var(--card-alt-color)] border border-[var(--border-color)] text-emerald-500 text-[9px] font-black uppercase rounded-none mb-4 tracking-widest italic">
                                    {client.establishmentType}
                                </div>
                            )}
                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-bold">
                                    <MapPin size={16} className="text-emerald-500" /> {client.city}, {client.state || ''}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-bold">
                                    <ShieldCheck size={16} className="text-emerald-500" /> {client.hoodCount || 0} Hood(s) / {client.filterCount || 0} Filtros
                                </div>
                                {client.lastServiceDate && (
                                    <div className="flex items-center gap-3 text-xs text-emerald-500 font-black uppercase tracking-tighter">
                                        <CheckCircle2 size={16} /> Último trabalho: {formatDate(client.lastServiceDate)}
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-xs text-[var(--text-faint)] font-bold uppercase tracking-widest">
                                    <Clock size={16} /> Próxima: {formatDate(client.nextServiceDate)}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedClient(client);
                                        setShowClientDetails(true);
                                    }}
                                    className="flex-1 py-2 bg-black/5 text-black rounded-none text-xs font-bold hover:bg-black/10 transition-colors"
                                >
                                    Detalhes
                                </button>
                                {user.role === 'admin' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditingClient(client);
                                                setShowEditClientModal(true);
                                            }}
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-none hover:bg-emerald-100 transition-colors"
                                            title="Editar Cliente"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClient(client.id);
                                            }}
                                            className="p-2 bg-red-50 text-red-600 rounded-none hover:bg-red-100 transition-colors"
                                            title="Excluir Cliente"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedClientId(client.id);
                                        setShowServiceModal(true);
                                    }}
                                    className="flex-1 py-2 bg-emerald-500 text-white rounded-none text-xs font-bold hover:bg-emerald-600 transition-colors"
                                >
                                    Limpeza
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientList;
