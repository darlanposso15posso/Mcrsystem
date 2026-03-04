import React from 'react';
import {
    Users,
    ClipboardList,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    ArrowRight,
    ShieldCheck,
    Phone,
    Calendar,
    Clock,
    Camera,
    MessageCircle,
    X
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import StatCard from './StatCard';
import { DashboardStats, ServiceRecord } from '../../types';
import { compressImage } from '../../utils/imageUtils';
import { formatDate } from '../../utils/timeUtils';

interface DashboardProps {
    user: any;
    stats: DashboardStats;
    upcomingServices: any[];
    recentServices: any[];
    alerts: any[];
    services: ServiceRecord[];
    activeService: ServiceRecord | null;
    completionChecklist: any;
    setCompletionChecklist: (checklist: any) => void;
    newService: any;
    setNewService: (service: any) => void;
    handleCompleteService: (e: React.FormEvent) => void;
    handleCancelService: () => void;
    handleDeleteNotification: (id: number) => void;
    notifications: any[];
    completionPhotos: string[];
    setCompletionPhotos: (photos: string[]) => void;
    preCleaningChecklistData: Record<string, boolean>;
    setPreCleaningChecklistData: (data: Record<string, boolean>) => void;
    users?: any[];
    settings?: Record<string, string>;
}

const Dashboard: React.FC<DashboardProps> = ({
    user,
    stats,
    upcomingServices,
    recentServices,
    alerts,
    services,
    activeService,
    completionChecklist,
    setCompletionChecklist,
    newService,
    setNewService,
    handleCompleteService,
    handleDeleteNotification,
    notifications,
    completionPhotos,
    setCompletionPhotos,
    preCleaningChecklistData,
    setPreCleaningChecklistData,
    users = [],
    settings = {}
}) => {
    // Calculando estatísticas da equipe
    const activeTechnicians = users.filter(u => u.role === 'technician' && u.status === 'active').length;
    const pendingTechnicians = users.filter(u => u.role === 'technician' && u.status === 'pending').length;
    const knowledgeStats = users.filter(u => u.role === 'technician' && u.status === 'active').reduce((acc, user) => {
        const level = user.knowledgeLevel || 'Aprendiz';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Setup Admin Broadcast note check
    const adminNote = user.role === 'technician' && settings ? settings['admin_broadcast_note'] : null;

    return (
        <div className="space-y-8 pb-32">
            {user.role === 'technician' && adminNote && adminNote.trim() !== '' && (
                <div className="bg-amber-100 p-6 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden flex items-center gap-4">
                    <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20 shrink-0"><MessageCircle size={28} /></div>
                    <div>
                        <h3 className="text-xl font-black text-amber-900 tracking-tight">Aviso Geral da Administração</h3>
                        <p className="text-amber-900/80 text-sm font-bold mt-1 max-w-2xl whitespace-pre-wrap">{adminNote}</p>
                    </div>
                </div>
            )}

            {user.role === 'admin' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Clientes Ativos"
                            value={stats.activeClients}
                            icon={<Users className="text-blue-500" />}
                            trend="Total"
                        />
                        <StatCard
                            title="Serviços no Mês"
                            value={stats.servicesThisMonth}
                            icon={<ClipboardList className="text-emerald-500" />}
                            trend="Executados"
                        />
                        <StatCard
                            title="Trabalhos Concluídos"
                            value={stats.completedServicesTotal || 0}
                            icon={<CheckCircle2 className="text-emerald-600" />}
                            trend="Total histórico"
                        />
                        <StatCard
                            title="Atrasados (Overdue)"
                            value={stats.overdueServices}
                            icon={<AlertTriangle className="text-amber-500" />}
                            trend="Ação necessária"
                            isWarning={stats.overdueServices > 0}
                        />
                        <StatCard
                            title="Projeção de Receita (Anual)"
                            value={`$${stats.estimatedRevenue.toLocaleString()}`}
                            icon={<TrendingUp className="text-purple-500" />}
                            trend="Projeção Lucro Bruto"
                        />
                    </div>

                    {/* Raio-X da Equipe */}
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-black/5 shadow-sm mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                                <Users className="text-blue-500" size={24} />
                                Raio-X da Equipe Técnica
                            </h3>
                            <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase">Gestão de Pessoal</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 bg-black/[0.02] rounded-2xl border border-black/5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-black/40 uppercase mb-1">Técnicos Ativos</p>
                                    <p className="text-3xl font-black text-emerald-600 leading-none">{activeTechnicians}</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
                            </div>

                            <div className="p-4 bg-black/[0.02] rounded-2xl border border-black/5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-black/40 uppercase mb-1">Cadastros Pendentes</p>
                                    <p className="text-3xl font-black text-amber-600 leading-none">{pendingTechnicians}</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center"><AlertTriangle size={24} /></div>
                            </div>

                            <div className="p-4 bg-black/[0.02] rounded-2xl border border-black/5">
                                <p className="text-xs font-bold text-black/40 uppercase mb-3">Nível de Conhecimento</p>
                                <div className="space-y-2">
                                    {Object.entries(knowledgeStats).map(([level, count]) => (
                                        <div key={level} className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-gray-700">{level}</span>
                                            <span className="font-bold bg-white px-2 py-0.5 rounded-lg border shadow-sm">{count as number}</span>
                                        </div>
                                    ))}
                                    {Object.keys(knowledgeStats).length === 0 && (
                                        <div className="text-xs text-black/40 italic">Nenhum dado cadastrado</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {alerts && alerts.length > 0 && (
                        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20"><AlertTriangle size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-amber-900 tracking-tight">Atenção: Serviços Próximos</h3>
                                    <p className="text-amber-700/80 text-sm font-bold">Estes clientes têm limpeza agendada para os próximos 20 dias.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                                {alerts.map((alert, i) => (
                                    <div key={i} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-900 line-clamp-1">{alert.clientName}</h4>
                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-lg">Faltam {alert.daysUntil} dias</span>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-1">{alert.city}, {alert.state}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-amber-50 flex flex-col gap-3 text-xs">
                                            <div className="flex justify-between items-center">
                                                <div className="font-bold text-gray-400">Data Limite:</div>
                                                <div className="font-black text-amber-600">{new Date(alert.nextServiceDate + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                                            </div>
                                            <a
                                                href={`https://wa.me/${alert.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, aqui é da D&E! A limpeza da coifa em ${alert.clientName} vence em ${alert.daysUntil} dias. Vamos confirmar a agenda?`)}`}
                                                target="_blank" rel="noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors"
                                            >
                                                <MessageCircle size={14} /> Enviar WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black tracking-tight">Agenda da Semana</h3>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase">Próximos 7 dias</span>
                                </div>
                                <div className="space-y-4">
                                    {upcomingServices.length > 0 ? upcomingServices.map((s, i) => {
                                        const nextDateVal = new Date(s.nextServiceDate + 'T12:00:00');
                                        const today = new Date();
                                        today.setHours(12, 0, 0, 0);
                                        const diff = nextDateVal.getTime() - today.getTime();
                                        const diffDays = Math.ceil(diff / (1000 * 3600 * 24));

                                        let bgClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                                        let textClass = "text-emerald-500";
                                        if (diffDays < 0) {
                                            bgClass = "bg-red-50 text-red-600 border-red-100";
                                            textClass = "text-red-500";
                                        } else if (diffDays === 0) {
                                            bgClass = "bg-blue-50 text-blue-600 border-blue-100";
                                            textClass = "text-blue-500";
                                        }

                                        return (
                                            <div key={i} className="flex items-center justify-between p-4 bg-black/[0.02] rounded-2xl hover:bg-black/[0.04] transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 ${bgClass} rounded-xl shadow-sm flex flex-col items-center justify-center border`}>
                                                        <span className={`text-[10px] font-black uppercase ${textClass}`}>{nextDateVal.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                                        <span className="text-xl font-black leading-none">{nextDateVal.getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-base">{s.restaurantName}</div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <div className="text-[10px] text-black/40 uppercase font-bold">{s.systemType}</div>
                                                            {diffDays < 0 && <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Atrasado</span>}
                                                            {diffDays === 0 && <span className="bg-blue-100 text-blue-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Hoje</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center py-12 text-black/20 font-medium">Nenhum serviço agendado.</div>
                                    )}
                                </div>
                            </div>

                            {user.role === 'admin' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                                        <h3 className="text-xl font-black tracking-tight mb-8">Volume de Serviços</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.monthlyTrends || []}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} />
                                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                                    <Bar dataKey="total" fill="#10b981" radius={[10, 10, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                                        <h3 className="text-xl font-black tracking-tight mb-8">Tipos de Negócio</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={stats.establishmentCounts || []}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {(stats.establishmentCounts || []).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'][index % 6]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="flex flex-wrap justify-center gap-3 mt-4">
                                                {(stats.establishmentCounts || []).map((entry, index) => (
                                                    <div key={index} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-black/60">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'][index % 6] }}></div>
                                                        {entry.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                                <h3 className="text-xl font-black tracking-tight mb-8">Atividade Recente</h3>
                                <div className="space-y-6">
                                    {recentServices.map((s, i) => (
                                        <div key={i} className="flex gap-4 relative">
                                            {i !== recentServices.length - 1 && <div className="absolute left-5 top-10 w-0.5 h-10 bg-black/5"></div>}
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 z-10">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold">{s.restaurantName}</div>
                                                <div className="text-[10px] text-black/40 font-bold uppercase">Limpeza Concluída</div>
                                                <div className="text-[10px] text-emerald-500 font-bold mt-1">{new Date(s.serviceDate).toLocaleDateString('pt-BR')}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {user.role === 'admin' && notifications && notifications.length > 0 && (
                                <div className="bg-red-50 p-5 md:p-8 rounded-[2.5rem] border border-red-100 shadow-sm">
                                    <h3 className="text-xl font-black tracking-tight mb-6 text-red-600">Avisos do Sistema</h3>
                                    <div className="space-y-4">
                                        {notifications.map((notif: any) => (
                                            <div key={notif.id} className="bg-white p-4 rounded-2xl flex items-start gap-4 border border-red-100 relative">
                                                <button onClick={() => handleDeleteNotification(notif.id)} className="absolute top-4 right-4 text-black/20 hover:text-red-500 transition-colors">
                                                    <X size={16} />
                                                </button>
                                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                                                    <AlertTriangle size={18} />
                                                </div>
                                                <div className="pr-6">
                                                    <p className="text-sm font-medium mb-1">{notif.message}</p>
                                                    <div className="text-[10px] text-black/40 font-bold uppercase">{new Date(notif.createdAt).toLocaleString('pt-BR')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-[#0A0A0B] p-5 md:p-8 rounded-[2.5rem] text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                <h3 className="text-lg font-bold mb-2">NFPA 96 Compliance</h3>
                                <p className="text-white/40 text-xs leading-relaxed mb-6">Mantenha seus clientes em conformidade com as normas de segurança contra incêndio.</p>
                                <div className="flex items-end justify-between">
                                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                                        <ShieldCheck size={16} />
                                        <span>PROTEÇÃO ATIVA</span>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-emerald-400">
                                        {stats.nfpaRate || 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    {activeService ? (
                        <div className="bg-white p-5 md:p-8 rounded-3xl border-2 border-emerald-500 shadow-xl">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4 md:gap-0">
                                <div>
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">Serviço em Andamento</span>
                                    <h2 className="text-3xl font-bold">{activeService.restaurantName}</h2>
                                    <p className="text-black/40 flex items-center gap-2 mt-1">
                                        <Clock size={16} /> Iniciado em: {activeService.inspectionStartTime ? new Date(activeService.inspectionStartTime).toLocaleTimeString() : 'N/A'}
                                    </p>
                                </div>
                                <div className="text-left md:text-right">
                                    <div className="text-sm font-bold text-emerald-600">Tempo Decorrido</div>
                                    <div className="text-2xl font-mono font-bold">
                                        {activeService.inspectionStartTime ? Math.floor((new Date().getTime() - new Date(activeService.inspectionStartTime).getTime()) / 60000) : 0} min
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg border-b pb-2">Checklist de Conclusão</h3>
                                    <div className="space-y-3">
                                        {Object.entries(completionChecklist).map(([key, val]) => (
                                            <label key={key} className="flex items-center gap-3 p-3 bg-black/5 rounded-xl cursor-pointer hover:bg-black/10 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={val as boolean}
                                                    onChange={e => setCompletionChecklist({ ...completionChecklist, [key]: e.target.checked })}
                                                    className="w-5 h-5 rounded text-emerald-500"
                                                />
                                                <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg border-b pb-2">Fotos de Conclusão</h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[0, 1, 2, 3, 4, 5].map(i => (
                                            <label key={i} className="aspect-square bg-black/5 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-black/10 hover:border-emerald-500 transition-colors cursor-pointer group relative overflow-hidden">
                                                {completionPhotos && completionPhotos[i] ? (
                                                    <img src={completionPhotos[i]} alt={`Foto ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                                                ) : (
                                                    <>
                                                        <Camera className="text-black/20 group-hover:text-emerald-500" size={24} />
                                                        <span className="text-[10px] text-black/40 mt-1 uppercase font-bold">Foto {i + 1}</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                const compressedBase64 = await compressImage(file);
                                                                const newPhotos = [...(completionPhotos || [])];
                                                                newPhotos[i] = compressedBase64;
                                                                setCompletionPhotos(newPhotos);
                                                            } catch (err) {
                                                                console.error("Erro ao comprimir imagem:", err);
                                                                alert("Erro ao processar a foto. Tente novamente.");
                                                            }
                                                        }
                                                    }}
                                                />
                                            </label>
                                        ))}
                                    </div>

                                    {/* Opções de Inspeção Opcional (Hood, Fan, Duto) */}
                                    <div className="pt-6 space-y-6">
                                        <h3 className="font-bold text-lg border-b pb-2">Inspeções Adicionais (Opcional)</h3>

                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                            {/* Hood Condition */}
                                            <div className="bg-black/[0.02] p-4 rounded-2xl border border-black/5">
                                                <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-3 tracking-widest">Condição das Coifas (Hoods)</h4>
                                                <div className="space-y-2">
                                                    {[
                                                        { id: "opt_hood_grease", label: "Acúmulo excessivo de gordura" },
                                                        { id: "opt_hood_corrosion", label: "Superfície interna com corrosão" },
                                                        { id: "opt_hood_welds", label: "Soldas ou junções danificadas" },
                                                        { id: "opt_hood_deep_clean", label: "Necessitou limpeza profunda" }
                                                    ].map(item => (
                                                        <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl transition-colors cursor-pointer group">
                                                            <input
                                                                type="checkbox"
                                                                checked={preCleaningChecklistData[item.id] || false}
                                                                onChange={e => setPreCleaningChecklistData({ ...preCleaningChecklistData, [item.id]: e.target.checked })}
                                                                className="w-5 h-5 rounded text-indigo-500 border-black/10 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-xs text-black/60 group-hover:text-black">{item.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Fan Condition */}
                                            <div className="bg-black/[0.02] p-4 rounded-2xl border border-black/5">
                                                <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-3 tracking-widest">Condições dos Exaustores (Fans)</h4>
                                                <div className="space-y-2">
                                                    {[
                                                        { id: "opt_fan_vibration", label: "Vibração anormal" },
                                                        { id: "opt_fan_noise", label: "Ruído excessivo" },
                                                        { id: "opt_fan_belt", label: "Correia desgastada" },
                                                        { id: "opt_fan_struct", label: "Estrutura problemática" },
                                                        { id: "opt_fan_fire_risk", label: "Risco de incêndio futuro" },
                                                        { id: "opt_fan_repair", label: "Necessita reparo estrutural" },
                                                        { id: "opt_fan_new", label: "Necessita novo Fan" },
                                                        { id: "opt_fan_maintenance", label: "Manutenção imediata" }
                                                    ].map(item => (
                                                        <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl transition-colors cursor-pointer group">
                                                            <input
                                                                type="checkbox"
                                                                checked={preCleaningChecklistData[item.id] || false}
                                                                onChange={e => setPreCleaningChecklistData({ ...preCleaningChecklistData, [item.id]: e.target.checked })}
                                                                className="w-5 h-5 rounded text-indigo-500 border-black/10 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-xs text-black/60 group-hover:text-black">{item.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Duct Condition */}
                                            <div className="bg-black/[0.02] p-4 rounded-2xl border border-black/5">
                                                <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-3 tracking-widest">Dutos de Exaustão</h4>
                                                <div className="space-y-2">
                                                    {[
                                                        { id: "duct_grease_leak", label: "Vazamento nas junções" },
                                                        { id: "duct_needs_panel", label: "Necessita novo painel de acesso" },
                                                        { id: "duct_obstruction", label: "Duto com obstrução parcial" }
                                                    ].map(item => (
                                                        <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl transition-colors cursor-pointer group">
                                                            <input
                                                                type="checkbox"
                                                                checked={preCleaningChecklistData[item.id] || false}
                                                                onChange={e => setPreCleaningChecklistData({ ...preCleaningChecklistData, [item.id]: e.target.checked })}
                                                                className="w-5 h-5 rounded text-indigo-500 border-black/10 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-xs text-black/60 group-hover:text-black">{item.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <div className="flex gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={newService.nfpaCompliance} onChange={e => setNewService({ ...newService, nfpaCompliance: e.target.checked })} className="rounded text-emerald-500" />
                                                <span className="text-sm font-bold">Conforme NFPA 96</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={newService.fireHazard} onChange={e => setNewService({ ...newService, fireHazard: e.target.checked })} className="rounded text-red-500" />
                                                <span className="text-sm font-bold">Risco de Incêndio</span>
                                            </label>
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold block mb-2">Observações / Anotações do Serviço</label>
                                            <textarea
                                                value={newService.notes || ''}
                                                onChange={e => setNewService({ ...newService, notes: e.target.value })}
                                                placeholder="Digite aqui recomendações para a próxima limpeza, peças trocadas, etc."
                                                className="w-full p-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 text-sm min-h-[100px]"
                                            ></textarea>
                                        </div>

                                        <button
                                            onClick={handleCompleteService}
                                            disabled={
                                                !Object.values(completionChecklist).every(v => v)
                                            }
                                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Finalizar e Enviar Relatório
                                        </button>
                                        {!Object.values(completionChecklist).every(v => v) && (
                                            <p className="text-[10px] text-center text-red-500 font-bold uppercase mt-1">Preencha todo o checklist para finalizar</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-5 md:p-8 rounded-3xl border border-black/5 shadow-sm">
                            <h2 className="text-2xl font-bold mb-2">Bem-vindo, {user.name}!</h2>
                            <p className="text-black/40">Nenhum serviço em andamento. Vá para a aba "Clientes" para iniciar uma nova limpeza.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Alerts and Pie Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Phone className="text-amber-500" size={20} />
                        {user.role === 'admin' ? 'Alertas de Agendamento' : 'Próximos Serviços'}
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {alerts.length === 0 ? (
                            <p className="text-sm text-black/40 italic">Nenhum alerta para os próximos 15 dias.</p>
                        ) : (
                            alerts.map((alert, idx) => (
                                <div key={idx} className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-sm">{alert.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-black/60 mb-2">
                                        <Calendar size={12} />
                                        <span>Próxima limpeza: {formatDate(alert.nextServiceDate)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href={`tel:${alert.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors">
                                            <Phone size={12} /> Ligar
                                        </a>
                                        <a
                                            href={`https://wa.me/${alert.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, aqui é da D&E! A limpeza da coifa em ${alert.name} será dia ${formatDate(alert.nextServiceDate)}. Vamos confirmar a agenda?`)}`}
                                            target="_blank" rel="noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors"
                                        >
                                            <MessageCircle size={12} /> WhatsApp
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                    <h3 className="font-bold text-lg mb-6">Status dos Sistemas (NFPA 96)</h3>
                    <div className="h-64 flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Conforme', value: services.filter(s => s.nfpaCompliance).length || 1 },
                                        { name: 'Não Conforme', value: services.filter(s => !s.nfpaCompliance).length || 0 },
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 text-xs mt-4">
                            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Conforme</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Não Conforme</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
