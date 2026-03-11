import React, { useState } from 'react';
import { Download, ChevronRight, AlertTriangle } from 'lucide-react';
import { ServiceRecord } from '../../types';
import { Loader2 } from 'lucide-react';
import { calculateDuration, formatDate } from '../../utils/timeUtils';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

interface ServiceHistoryProps {
    user: any;
    clients: any[];
    filteredServices: ServiceRecord[];
    generatePDF: (service: ServiceRecord, client?: any, logoUrl?: string) => void;
    logoUrl?: string;
    settings?: Record<string, string>;
    segmentLabels?: SegmentLabels;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ServiceHistory: React.FC<ServiceHistoryProps> = ({ user, clients, filteredServices, generatePDF, logoUrl, settings = {}, segmentLabels, showToast }) => {
    const currentLang = (settings['language'] as Language) || 'pt';
    const t = translations[currentLang];
    const [generatingId, setGeneratingId] = useState<string | number | null>(null);

    const handleGeneratePDF = async (service: ServiceRecord) => {
        setGeneratingId(service.id);
        try {
            // Busca o registro completo incluindo as fotos (que foram omitidas da listagem principal por performance)
            const { data: fullService, error } = await supabase
                .from('services')
                .select('*')
                .eq('id', service.id)
                .single();

            if (error) throw error;
            if (!fullService) throw new Error("Serviço não encontrado");

            const client = clients.find(c => c.id === service.clientId);
            // Mapeia o serviço vindo do banco antes de passar para o gerador
            const { mapService } = await import('../../lib/supabaseUtils');
            await generatePDF(mapService(fullService), client, logoUrl);
        } catch (error) {
            console.error("PDF generation failed:", error);
            showToast("Erro ao gerar PDF: arquivo incompleto ou erro de conexão.", 'error');
        } finally {
            setGeneratingId(null);
        }
    };

    return (
        <div className="bg-[var(--card-color)] rounded-none border border-[var(--border-muted)] shadow-2xl overflow-hidden emerald-glow">
            <div className="p-8 bg-[var(--bg-color)] border-b border-[var(--border-muted)] flex items-center justify-between">
                <h3 className="font-black text-white uppercase italic tracking-tight text-xl">
                    {user.role === 'admin' ? 'Log Central de Operações' : 'Meu Histórico de Intervenções'}
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[var(--card-alt-color)] text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest">
                            <th className="px-6 py-5 border-b border-[var(--border-muted)]">{segmentLabels?.client || 'Estabelecimento'}</th>
                            <th className="px-6 py-5 border-b border-[var(--border-muted)]">Cronologia</th>
                            {user.role === 'admin' && <th className="px-6 py-5 border-b border-[var(--border-muted)]">Operador</th>}
                            <th className="px-6 py-5 border-b border-[var(--border-muted)]">NFPA 96</th>
                            <th className="px-6 py-5 border-b border-[var(--border-muted)]">Risco Ígneo</th>
                            <th className="px-6 py-5 border-b border-[var(--border-muted)]">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredServices
                            .filter(s => user.role === 'admin' || s.technicianName === user.name)
                            .map((service) => {
                                const duration = calculateDuration(service.inspectionStartTime, service.completionTime);

                                return (
                                    <tr key={service.id} className="hover:bg-white/[0.03] transition-colors group">
                                        <td className="px-6 py-6 font-black">
                                            <div className="text-white uppercase italic tracking-tight">{service.restaurantName}</div>
                                            <div className="text-[10px] text-[var(--text-faint)] font-bold uppercase tracking-widest mt-1">Ref: {service.reportNumber || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-xs font-black text-white uppercase tracking-tighter">
                                                {formatDate(service.serviceDate)}
                                            </div>
                                            {duration !== "N/A" && (
                                                <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-1">Tempo: {duration}</div>
                                            )}
                                        </td>
                                        {user.role === 'admin' && <td className="px-6 py-6 text-xs font-bold text-[var(--text-muted)] uppercase">{service.technicianName}</td>}
                                        <td className="px-6 py-6">
                                            {service.nfpaCompliance ? (
                                                <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-none border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">Aprovado</span>
                                            ) : (
                                                <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-none border border-red-500/20 text-[9px] font-black uppercase tracking-widest">Crítico</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-6">
                                            {service.fireHazard ? (
                                                <span className="text-red-500 flex items-center gap-1 font-black text-[9px] uppercase tracking-widest animate-pulse"><AlertTriangle size={14} /> Alto Risco</span>
                                            ) : (
                                                <span className="text-emerald-500 font-black text-[9px] uppercase tracking-widest tracking-tighter shadow-none">Seguro</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleGeneratePDF(service)}
                                                    disabled={generatingId === service.id}
                                                    className={`p-2 rounded-none transition-all border border-[var(--border-muted)] ${generatingId === service.id ? 'bg-[var(--card-alt-color)] text-[var(--text-faint)] cursor-wait' : 'hover:bg-emerald-500 hover:text-[var(--bg-color)] text-emerald-500 border-emerald-500/20 shadow-lg shadow-emerald-500/10'}`}
                                                    title="Gerar PDF"
                                                >
                                                    {generatingId === service.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                                </button>
                                                <button className="p-2 hover:bg-[var(--card-alt-color)]/80 rounded-none text-[var(--text-faint)] hover:text-white border border-[var(--border-muted)]" title="Ver Detalhes">
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
        </div >
    );
};

export default ServiceHistory;
