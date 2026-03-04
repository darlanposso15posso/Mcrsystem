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
                // Find client price (fallback to 0) => the API doesn't return cleaningPrice in services, 
                // but we might need to either mock it or extract if it's there. 
                // Assuming we don't have price inside service object natively yet without fetching clients, 
                // we'll display what we can, or just show execution times if price is missing in this context.
                // Wait, Performance receives 'services' but not 'clients'. Let's just calculate average time for now.
                clientData[s.clientId] = {
                    name: s.restaurantName || `Cliente ${s.clientId}`,
                    totalHours: 0,
                    count: 0,
                    price: 0 // We'll just show time for now since cleaningPrice is not in the service payload
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black tracking-tight">Desempenho da Equipe</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                        <h3 className="text-xl font-bold mb-8">Serviços por Técnico</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={techStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" />
                                    <Bar name="Conforme" dataKey="compliant" fill="#10b981" radius={[10, 10, 0, 0]} />
                                    <Bar name="Não Conforme" dataKey="nonCompliant" fill="#ef4444" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                        <h3 className="text-xl font-bold mb-6">Métricas de Qualidade</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold">Taxa de Conformidade</div>
                                    <div className="text-2xl font-black">
                                        {services.length > 0
                                            ? Math.round((services.filter(s => s.nfpaCompliance).length / services.length) * 100)
                                            : 0}%
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                                    <UserCheck size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold">Média Mensal / Técnico</div>
                                    <div className="text-2xl font-black">
                                        {techStats.length > 0
                                            ? (services.length / techStats.length).toFixed(1)
                                            : 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                            <Star size={18} fill="currentColor" />
                            Destaque do Mês
                        </h3>
                        {techStats.length > 0 ? (
                            <div className="mt-4">
                                <div className="text-2xl font-black">{techStats.sort((a, b) => b.total - a.total)[0].name}</div>
                                <div className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                                    {techStats.sort((a, b) => b.total - a.total)[0].total} Serviços Concluídos
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 text-white/40 italic">Sem dados suficientes</div>
                        )}
                    </div>
                </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm mt-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Clock className="text-amber-500" />
                        Análise de Tempo de Execução (Restaurantes mais demorados)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-black/5 text-black/40 text-xs uppercase font-bold tracking-wider">
                                <th className="px-6 py-4 rounded-l-xl">Restaurante</th>
                                <th className="px-6 py-4">Serviços Analisados</th>
                                <th className="px-6 py-4 rounded-r-xl">Tempo Médio (Horas)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {profitabilityStats.length > 0 ? (
                                profitabilityStats.map((stat, i) => (
                                    <tr key={i} className="hover:bg-black/[0.02]">
                                        <td className="px-6 py-4 font-bold">{stat.name}</td>
                                        <td className="px-6 py-4 text-black/60 font-mono">{stat.count}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="text-amber-600 font-bold font-mono text-lg">{stat.avgHours.toFixed(1)}h</div>
                                                <div className="w-24 h-2 bg-black/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-500 rounded-full"
                                                        style={{ width: `${Math.min((stat.avgHours / 5) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-black/40 italic">
                                        Nenhum dado de tempo de execução com Início e Fim registrados.
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
