import React, { useMemo } from 'react';
import { TrendingUp, UserCheck, Star, Clock, DollarSign } from 'lucide-react';
import { calculateDurationHours } from '../../utils/timeUtils';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

interface PerformanceProps {
    users: any[];
    services: any[];
}

const Performance: React.FC<PerformanceProps> = ({ users, services }) => {
    // Basic performance calculation logic
    const techStats = users.filter(u => u.role === 'technician').map(tech => {
        const techServices = services.filter(s => s.technicianName === tech.name);
        return {
            name: tech.name,
            total: techServices.length,
            compliant: techServices.filter(s => s.nfpaCompliance).length,
            nonCompliant: techServices.filter(s => !s.nfpaCompliance).length
        };
    });

    const profitabilityStats = useMemo(() => {
        const completed = services.filter(s => s.status === 'COMPLETED' && s.inspectionStartTime && s.completionTime);

        // Group by client
        const clientData: Record<number, { name: string, totalHours: number, count: number, price: number }> = {};

        completed.forEach(s => {
            if (!clientData[s.clientId]) {
                clientData[s.clientId] = {
                    name: s.restaurantName || `Cliente ${s.clientId}`,
                    totalHours: 0,
                    count: 0,
                    price: 0
                };
            }
            clientData[s.clientId].totalHours += calculateDurationHours(s.inspectionStartTime, s.completionTime);
            clientData[s.clientId].count += 1;
        });

        return Object.values(clientData)
            .map(c => ({
                name: c.name,
                avgHours: c.totalHours / c.count,
                count: c.count
            }))
            .sort((a, b) => b.avgHours - a.avgHours)
            .slice(0, 5); // Top 5 longest services
    }, [services]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Análise de Performance</h2>
                    <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-1">Métricas operacionais e eficiência técnica da força de trabalho.</p>
                </div>
                <div className="p-4 bg-blue-500 text-[var(--bg-color)] rounded-none shadow-lg shadow-blue-500/20">
                    <TrendingUp size={32} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow flex flex-col h-full">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-8 border-b border-[var(--border-muted)] pb-2">Volume Operacional por Técnico</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={techStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: 'var(--bg-color)', borderRadius: '0px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    />
                                    <Legend iconType="rect" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                    <Bar name="Conforme" dataKey="compliant" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                    <Bar name="Não Conforme" dataKey="nonCompliant" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-8 border-b border-[var(--border-muted)] pb-2">KPIs de Qualidade</h3>
                        <div className="space-y-10">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-none flex items-center justify-center text-blue-500">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Conformidade NFPA</div>
                                    <div className="text-3xl font-black text-blue-500 italic">
                                        {services.length > 0
                                            ? Math.round((services.filter(s => s.nfpaCompliance).length / services.length) * 100)
                                            : 0}%
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-none flex items-center justify-center text-blue-500">
                                    <UserCheck size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Média Produtiva</div>
                                    <div className="text-3xl font-black text-blue-500 italic">
                                        {techStats.length > 0
                                            ? (services.length / techStats.length).toFixed(1)
                                            : 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500 p-8 rounded-none text-[var(--bg-color)] overflow-hidden relative blue-glow">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-none -mr-16 -mt-16 blur-3xl"></div>
                        <h3 className="text-[10px] font-black mb-4 flex items-center gap-2 uppercase tracking-widest border-b border-[var(--bg-color)]/10 pb-1">
                            <Star size={14} fill="currentColor" />
                            Operador de Elite
                        </h3>
                        {techStats.length > 0 ? (
                            <div className="mt-4">
                                <div className="text-3xl font-black uppercase italic tracking-tighter leading-none">{techStats.sort((a, b) => b.total - a.total)[0].name}</div>
                                <div className="text-[var(--bg-color)]/60 text-[10px] font-black uppercase tracking-widest mt-2">
                                    {techStats.sort((a, b) => b.total - a.total)[0].total} Operações Concluídas
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 text-[var(--bg-color)]/40 italic font-bold">Aguardando dados...</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl mt-8 blue-glow">
                <div className="flex justify-between items-center mb-8 border-b border-[var(--border-muted)] pb-2">
                    <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-3">
                        <Clock className="text-blue-500" />
                        Logística de Tempo (Top 5 Gargalos)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[var(--card-alt-color)] text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest">
                                <th className="px-6 py-5 border-[var(--border-muted)]">Unidade de Serviço</th>
                                <th className="px-6 py-5 border-[var(--border-muted)]">Amostragem</th>
                                <th className="px-6 py-5 border-[var(--border-muted)]">Duração Média</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {profitabilityStats.length > 0 ? (
                                profitabilityStats.map((stat, i) => (
                                    <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                                        <td className="px-6 py-6 font-black text-white uppercase italic tracking-tight">{stat.name}</td>
                                        <td className="px-6 py-6 text-[var(--text-muted)] font-black text-xs">{stat.count} Intervenções</td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="text-blue-500 font-black text-xl italic">{stat.avgHours.toFixed(1)}h</div>
                                                <div className="flex-1 max-w-[200px] h-1.5 bg-[var(--card-alt-color)] rounded-none overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 shadow-lg shadow-blue-500/20"
                                                        style={{ width: `${Math.min((stat.avgHours / 5) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-[var(--text-faint)] font-black uppercase tracking-widest text-[10px] italic">
                                        Nenhum dado logístico consolidado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Performance;
