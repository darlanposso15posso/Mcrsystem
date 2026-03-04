import React from 'react';
import { Plus, MapPin, ShieldCheck, CheckCircle2, Clock, Edit, Trash2 } from 'lucide-react';
import { Client } from '../../types';
import { formatDate } from '../../utils/timeUtils';

interface ClientListProps {
    user: any;
    filteredClients: Client[];
    setShowClientModal: (show: boolean) => void;
    setSelectedClient: (client: Client) => void;
    setShowClientDetails: (show: boolean) => void;
    setEditingClient: (client: Client) => void;
    setShowEditClientModal: (show: boolean) => void;
    setSelectedClientId: (id: number) => void;
    setShowServiceModal: (show: boolean) => void;
    handleDeleteClient: (id: number) => void;
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
    handleDeleteClient
}) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold">Gestão de Clientes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map(client => (
                    <div key={client.id}>
                        {/* Mobile Simplified View */}
                        <div
                            className="md:hidden bg-white p-4 rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-pointer"
                            onClick={() => {
                                setSelectedClient(client);
                                setShowClientDetails(true);
                            }}
                        >
                            <div className="w-12 h-12 shrink-0 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-bold text-xl">
                                {client.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base truncate">{client.name}</h3>
                                <div className="text-xs text-black/60 truncate flex items-center gap-1 mt-0.5">
                                    <MapPin size={12} /> {client.city}
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-3">
                                <div className="text-right">
                                    {client.nextServiceDate ? (
                                        <>
                                            <div className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Próxima</div>
                                            <div className="text-xs font-bold text-emerald-600 mt-0.5">{formatDate(client.nextServiceDate).substring(0, 5)}</div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{client.recurrence}</div>
                                    )}
                                </div>
                                {user.role === 'admin' && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingClient(client);
                                                setShowEditClientModal(true);
                                            }}
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                            title="Editar Cliente"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClient(client.id);
                                            }}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                            title="Excluir Cliente"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Desktop Detailed View */}
                        <div className="hidden md:block bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-bold text-xl">
                                    {client.name[0]}
                                </div>
                                <span className="text-[10px] font-bold bg-black/5 text-black/40 px-2 py-1 rounded-full uppercase tracking-wider">
                                    {client.recurrence}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg mb-1">{client.name}</h3>
                            {client.establishmentType && (
                                <div className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-lg mb-3 tracking-widest">
                                    {client.establishmentType}
                                </div>
                            )}
                            {!client.establishmentType && (
                                <div className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase rounded-lg mb-3 tracking-widest">
                                    Restaurante
                                </div>
                            )}
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-xs text-black/60">
                                    <MapPin size={14} /> {client.city}, {client.state || ''}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-black/60">
                                    <ShieldCheck size={14} /> {client.hoodCount || 0} Hood(s) / {client.filterCount || 0} Filtros
                                </div>
                                {client.lastServiceDate && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                                        <CheckCircle2 size={14} /> Último trabalho: {formatDate(client.lastServiceDate)}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-black/60">
                                    <Clock size={14} /> Próxima: {formatDate(client.nextServiceDate)}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedClient(client);
                                        setShowClientDetails(true);
                                    }}
                                    className="flex-1 py-2 bg-black/5 text-black rounded-lg text-xs font-bold hover:bg-black/10 transition-colors"
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
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                            title="Editar Cliente"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClient(client.id);
                                            }}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
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
                                    className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
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
