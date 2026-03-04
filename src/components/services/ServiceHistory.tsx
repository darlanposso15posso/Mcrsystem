import React, { useState } from 'react';
import { Download, ChevronRight, AlertTriangle } from 'lucide-react';
import { ServiceRecord } from '../../types';
import { Loader2 } from 'lucide-react';
import { calculateDuration, formatDate } from '../../utils/timeUtils';

interface ServiceHistoryProps {
    user: any;
    clients: any[];
    filteredServices: ServiceRecord[];
    generatePDF: (service: ServiceRecord, client?: any) => void;
}

const ServiceHistory: React.FC<ServiceHistoryProps> = ({ user, clients, filteredServices, generatePDF }) => {
    const [generatingId, setGeneratingId] = useState<number | null>(null);

    const handleGeneratePDF = async (service: ServiceRecord) => {
        setGeneratingId(service.id);
        try {
            const client = clients.find(c => c.id === service.clientId);
            await generatePDF(service, client);
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Erro ao gerar PDF.");
        } finally {
            setGeneratingId(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <h3 className="font-bold text-lg">{user.role === 'admin' ? 'Histórico Geral de Limpezas' : 'Meus Serviços Realizados'}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-black/5 text-black/40 text-xs uppercase font-bold tracking-wider">
                            <th className="px-6 py-4">Restaurante</th>
                            <th className="px-6 py-4">Data</th>
                            {user.role === 'admin' && <th className="px-6 py-4">Técnico</th>}
                            <th className="px-6 py-4">NFPA 96</th>
                            <th className="px-6 py-4">Risco Fogo</th>
                            <th className="px-6 py-4">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {filteredServices
                            .filter(s => user.role === 'admin' || s.technicianName === user.name)
                            .map((service) => {
                                const duration = calculateDuration(service.inspectionStartTime, service.completionTime);

                                return (
                                    <tr key={service.id} className="hover:bg-black/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold">{service.restaurantName}</div>
                                            <div className="text-xs text-black/40">Relatório: {service.reportNumber || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-mono">
                                                {formatDate(service.serviceDate)}
                                            </div>
                                            {duration !== "N/A" && (
                                                <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Duração: {duration}</div>
                                            )}
                                        </td>
                                        {user.role === 'admin' && <td className="px-6 py-4 text-sm">{service.technicianName}</td>}
                                        <td className="px-6 py-4">
                                            {service.nfpaCompliance ? (
                                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">CONFORME</span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">NÃO CONFORME</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {service.fireHazard ? (
                                                <span className="text-red-500 flex items-center gap-1 font-bold text-xs"><AlertTriangle size={14} /> ALTO</span>
                                            ) : (
                                                <span className="text-emerald-500 font-bold text-xs">BAIXO</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {user.role === 'admin' && (
                                                    <button
                                                        onClick={() => handleGeneratePDF(service)}
                                                        disabled={generatingId === service.id}
                                                        className={`p-2 rounded-lg transition-colors ${generatingId === service.id ? 'bg-black/5 text-black/40 cursor-wait' : 'hover:bg-emerald-50 text-emerald-600'}`}
                                                        title="Gerar PDF"
                                                    >
                                                        {generatingId === service.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                                    </button>
                                                )}
                                                <button className="p-2 hover:bg-black/5 rounded-lg text-black/60" title="Ver Detalhes">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ServiceHistory;
