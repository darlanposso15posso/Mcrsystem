import React from 'react';
import {
    Users,
    ClipboardList,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    ShieldCheck,
    Phone,
    Calendar,
    Clock,
    Camera,
    MessageCircle,
    X,
    Settings,
    Eye,
    EyeOff,
    PieChart,
    Plus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts';
import StatCard from './StatCard';
import { DashboardStats, ServiceRecord } from '../../types';
import { compressImage } from '../../utils/imageUtils';
import { formatDate } from '../../utils/timeUtils';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

interface DashboardProps {
    user: any;
    stats: DashboardStats;
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
    segmentLabels?: SegmentLabels;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    confirmAction: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    user,
    stats,
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
    settings = {},
    segmentLabels,
    showToast,
    confirmAction
}) => {
    const currentLang = (settings['language'] as Language) || 'pt';
    const t = translations[currentLang];
    // Dashboard Widget Customization State
    const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>({
        stats_overview: true,
        team_stats: true,
        upcoming_services: true,
        revenue_chart: true,
        business_types_chart: true,
        recent_activity: true,
        system_notices: true,
        nfpa_compliance: true
    });
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [extraCompletionPhotos, setExtraCompletionPhotos] = useState(0);

    // Load/Save Widget Preferences
    useEffect(() => {
        const saved = localStorage.getItem('dashboard_widgets');
        if (saved) {
            try {
                setVisibleWidgets(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse dashboard widgets", e);
            }
        }
    }, []);

    const toggleWidget = (id: string) => {
        const newState = { ...visibleWidgets, [id]: !visibleWidgets[id] };
        setVisibleWidgets(newState);
        localStorage.setItem('dashboard_widgets', JSON.stringify(newState));
    };

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
                <div className="bg-amber-100/10 p-6 rounded-none border border-amber-500/20 blue-glow relative overflow-hidden flex items-center gap-4">
                    <div className="p-3 bg-amber-500 text-white rounded-none shadow-lg shadow-amber-500/20 shrink-0"><MessageCircle size={28} /></div>
                    <div>
                        <h3 className="text-xl font-black text-amber-500 tracking-tight">Aviso Geral da Administração</h3>
                        <p className="text-[var(--text-muted)] text-sm font-bold mt-1 max-w-2xl whitespace-pre-wrap">{adminNote}</p>
                    </div>
                </div>
            )}

            {user.role === 'admin' ? (
                <>
                    {/* Admin Header with Customization Toggle */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-white mb-1">Visão Geral</h2>
                            <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest italic">Controle Central D&E</p>
                        </div>
                        <button
                            onClick={() => setIsCustomizing(!isCustomizing)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-none font-bold text-xs transition-all ${isCustomizing ? 'bg-blue-600 text-white' : 'bg-[var(--card-alt-color)] text-[var(--text-muted)] hover:bg-[var(--card-alt-color)]/80'
                                }`}
                        >
                            <Settings size={16} />
                            {isCustomizing ? 'Salvar Dashboard' : 'Personalizar'}
                        </button>
                    </div>

                    {/* Customizer Panel */}
                    {isCustomizing && (
                        <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-none mb-8 blue-glow animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Settings size={14} /> Gerenciar Widgets
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(visibleWidgets).map(([id, visible]) => (
                                    <button
                                        key={id}
                                        onClick={() => toggleWidget(id)}
                                        className={`flex items-center justify-between p-3 border transition-all ${visible
                                            ? 'bg-blue-600/20 border-blue-600/50 text-blue-400'
                                            : 'bg-[var(--card-alt-color)] border-[var(--border-color)] text-[var(--text-muted)] grayscale'
                                            }`}
                                    >
                                        <span className="text-[10px] font-bold uppercase truncate pr-2">
                                            {id.replace(/_/g, ' ')}
                                        </span>
                                        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Stats Grid */}
                    {visibleWidgets.stats_overview && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title={segmentLabels?.clients || t.active_clients}
                                value={stats.activeClients}
                                icon={<Users size={20} />}
                                trend="+12% vs last month"
                                color="blue"
                            />
                            <StatCard
                                title={segmentLabels?.services || t.services_month}
                                value={stats.servicesThisMonth}
                                icon={<ClipboardList size={20} />}
                                trend="+5% vs last month"
                                color="blue"
                            />
                            <StatCard
                                title={t.completed_total}
                                value={stats.completedServicesTotal}
                                icon={<CheckCircle2 size={20} />}
                                color="purple"
                            />
                            <StatCard
                                title={t.overdue}
                                value={stats.overdueServices}
                                icon={<AlertTriangle size={20} />}
                                color="red"
                            />
                            <StatCard
                                title={t.revenue_est}
                                value={`$${stats.estimatedRevenue.toLocaleString()}`}
                                icon={<TrendingUp size={20} />}
                                trend="+8% vs last month"
                                color="amber"
                            />
                            <StatCard
                                title={segmentLabels?.next_check || t.next_service}
                                value={activeService ? formatDate(activeService.serviceDate) : '---'}
                                icon={<Calendar size={20} />}
                                color="indigo"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Revenue Chart Widget */}
                            {visibleWidgets.revenue_chart && (
                                <div className="bg-[var(--card-color)] p-6 md:p-8 rounded-none border border-[var(--border-muted)] blue-glow-hover transition-all">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
                                                <TrendingUp className="text-blue-600" size={24} />
                                                Faturamento e Projeção
                                            </h3>
                                            <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">Estimativa de Lucro Bruto Anual</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-[var(--text-faint)] uppercase tracking-widest mb-1">Média Anual</p>
                                            <p className="text-3xl font-black text-blue-600">${stats.estimatedRevenue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.monthlyTrends || []}>
                                                <Bar dataKey="total" fill="url(#blueGradient)" radius={[0, 0, 0, 0]} barSize={40} className="blue-glow" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Team Stats Widget */}
                            {visibleWidgets.team_stats && (
                                <div className="bg-[var(--card-color)] p-6 md:p-8 rounded-none border border-[var(--border-muted)] blue-glow-hover transition-all">
                                    <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-3 mb-8">
                                        <Users className="text-blue-600" size={24} />
                                        Equipe Técnica
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="p-5 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-white/30 uppercase mb-1">Ativos</p>
                                                    <p className="text-3xl font-black text-blue-600 leading-none">{activeTechnicians}</p>
                                                </div>
                                                <CheckCircle2 className="text-blue-600/50" size={32} />
                                            </div>
                                            <div className="p-5 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-white/30 uppercase mb-1">Pendentes</p>
                                                    <p className="text-3xl font-black text-amber-500 leading-none">{pendingTechnicians}</p>
                                                </div>
                                                <AlertTriangle className="text-amber-500/50" size={32} />
                                            </div>
                                        </div>
                                        <div className="p-6 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)]">
                                            <p className="text-xs font-bold text-blue-600 uppercase mb-4 tracking-widest">Capacitação</p>
                                            <div className="space-y-4">
                                                {Object.entries(knowledgeStats).map(([level, count]) => (
                                                    <div key={level}>
                                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-[var(--text-muted)] mb-1">
                                                            <span>{level}</span>
                                                            <span>{count as number} Técnico(s)</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-[var(--card-alt-color)] rounded-none overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-600 blue-glow"
                                                                style={{ width: `${((count as number) / (activeTechnicians || 1)) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Upcoming / Alerts Widget */}
                            {visibleWidgets.upcoming_services && alerts && alerts.length > 0 && (
                                <div className="bg-amber-500/5 p-8 rounded-none border border-amber-500/20 blue-glow transition-all">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-3 bg-amber-500 text-white rounded-none shadow-lg shadow-amber-500/20"><AlertTriangle size={24} /></div>
                                        <div>
                                            <h3 className="text-xl font-black text-amber-500 tracking-tight">Alertas de Agendamento</h3>
                                            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-1">Próximos 20 dias</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {alerts.map((alert, i) => (
                                            <div key={i} className="bg-[var(--card-color)] p-5 rounded-none border border-[var(--border-muted)] flex flex-col justify-between blue-glow-hover transition-all">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-black text-white line-clamp-1 uppercase text-xs tracking-tight">{alert.clientName}</h4>
                                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase rounded-none border border-amber-500/20">{alert.daysUntil} DIAS</span>
                                                    </div>
                                                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{alert.city}</p>
                                                </div>
                                                <div className="mt-6 flex flex-col gap-3">
                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                        <span className="text-[var(--text-faint)] uppercase tracking-widest">Vencimento</span>
                                                        <span className="text-amber-500 font-black">{new Date(alert.nextServiceDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                    <a
                                                        href={`https://wa.me/${alert.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, aqui é da D&E! A limpeza da coifa em ${alert.clientName} vence em ${alert.daysUntil} dias. Vamos confirmar a agenda?`)}`}
                                                        target="_blank" rel="noreferrer"
                                                        className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded-none text-xs font-black hover:bg-blue-700 transition-all uppercase tracking-tighter"
                                                    >
                                                        <MessageCircle size={14} /> Confirmar Agenda
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-8">
                            {/* Business Type Pie Chart Widget */}
                            {visibleWidgets.business_types_chart && (
                                <div className="bg-[var(--card-color)] p-6 md:p-8 rounded-none border border-[var(--border-muted)] blue-glow-hover transition-all">
                                    <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-3 mb-8">
                                        <PieChart size={24} className="text-blue-600" />
                                        Tipos de Negócio
                                    </h3>
                                    <div className="h-64 relative flex flex-col items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsPieChart>
                                                <Pie
                                                    data={stats.establishmentCounts || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {(stats.establishmentCounts || []).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#2563eb', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'][index % 6]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: 'var(--card-color)', border: 'none', borderRadius: '0px' }} />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Total</span>
                                            <span className="text-2xl font-black text-white">{stats.activeClients}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                                        {(stats.establishmentCounts || []).map((entry, index) => (
                                            <div key={index} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30 bg-[var(--card-alt-color)] px-2 py-1">
                                                <div className="w-2 h-2 rounded-none" style={{ backgroundColor: ['#3b82f6', '#2563eb', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'][index % 6] }}></div>
                                                {entry.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity Widget */}
                            {visibleWidgets.recent_activity && (
                                <div className="bg-[var(--card-color)] p-6 md:p-8 rounded-none border border-[var(--border-muted)] blue-glow-hover transition-all">
                                    <h3 className="text-xl font-black tracking-tight text-white mb-8">Fluxo Recente</h3>
                                    <div className="space-y-6">
                                        {recentServices.map((s, i) => (
                                            <div key={i} className="flex gap-4 relative">
                                                {i !== recentServices.length - 1 && <div className="absolute left-5 top-10 w-px h-10 bg-[var(--card-alt-color)]"></div>}
                                                <div className="w-10 h-10 rounded-none bg-[var(--card-alt-color)] border border-[var(--border-color)] flex items-center justify-center text-blue-500 shrink-0 z-10 blue-glow">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-white uppercase tracking-tight">{s.restaurantName}</div>
                                                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Limpeza Concluída</div>
                                                    <div className="text-[10px] text-blue-500 font-black mt-1 uppercase">{new Date(s.serviceDate).toLocaleDateString('pt-BR')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* NFPA Compliance Gauge Widget */}
                            {visibleWidgets.nfpa_compliance && (
                                <div className="bg-blue-600 p-8 rounded-none text-[var(--bg-color)] overflow-hidden relative blue-glow">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    <h3 className="text-lg font-black uppercase tracking-tighter mb-2 italic">Standard NFPA 96</h3>
                                    <p className="text-[var(--bg-color)]/60 text-xs font-bold leading-tight mb-8">Índice atual de conformidade na base instalada.</p>
                                    <div className="flex items-end justify-between">
                                        <div className="flex items-center gap-2 text-[var(--bg-color)] font-black text-xs">
                                            <ShieldCheck size={20} />
                                            <span className="uppercase tracking-widest">Security Score</span>
                                        </div>
                                        <div className="text-4xl font-black tracking-tighter text-[var(--bg-color)] underline decoration-4 underline-offset-4">
                                            {stats.nfpaRate || 0}%
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* System Notices Widget (Admin Notifications) */}
                            {visibleWidgets.system_notices && notifications && notifications.length > 0 && (
                                <div className="bg-red-500/5 p-8 rounded-none border border-red-500/20 transition-all">
                                    <h3 className="text-xl font-black tracking-tight mb-8 text-red-500 uppercase italic">Avisos do Sistema</h3>
                                    <div className="space-y-4">
                                        {notifications.map((notif: any) => (
                                            <div key={notif.id} className="bg-[var(--card-color)] p-5 rounded-none flex items-start gap-4 border border-[var(--border-muted)] relative blue-glow-hover transition-all">
                                                <button onClick={() => handleDeleteNotification(notif.id)} className="absolute top-4 right-4 text-[var(--text-faint)] hover:text-red-500 transition-colors">
                                                    <X size={16} />
                                                </button>
                                                <div className="w-10 h-10 rounded-none bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                                    <AlertTriangle size={18} />
                                                </div>
                                                <div className="pr-6">
                                                    <p className="text-sm font-bold text-white mb-2 leading-tight">{notif.message}</p>
                                                    <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{new Date(notif.createdAt).toLocaleString('pt-BR')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                /* Technician View - Redesigned for Dark theme but keeping functionally identical */
                <div className="space-y-6">
                    {activeService ? (
                        <div className="bg-[var(--card-color)] p-6 md:p-10 rounded-none border border-blue-600 shadow-xl blue-glow animate-pulse-subtle">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 md:gap-0">
                                <div>
                                    <span className="text-[10px] font-black bg-blue-600 text-[var(--bg-color)] px-4 py-1 rounded-none uppercase tracking-widest mb-3 inline-block">Serviço em Andamento</span>
                                    <h2 className="text-4xl font-black text-white tracking-tight">{activeService.restaurantName}</h2>
                                    <p className="text-[var(--text-muted)] flex items-center gap-2 mt-2 font-bold uppercase text-[10px] tracking-widest">
                                        <Clock size={16} className="text-blue-600" /> Iniciado: {activeService.inspectionStartTime ? new Date(activeService.inspectionStartTime).toLocaleTimeString() : 'N/A'}
                                    </p>
                                </div>
                                <div className="text-left md:text-right">
                                    <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Tempo de Operação</div>
                                    <div className="text-3xl font-mono font-black text-white">
                                        {activeService.inspectionStartTime ? Math.floor((new Date().getTime() - new Date(activeService.inspectionStartTime).getTime()) / 60000) : 0} min
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <h3 className="font-black text-lg text-white uppercase tracking-widest border-b border-[var(--border-muted)] pb-4">Checklist de Conclusão</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {Object.entries(completionChecklist).map(([key, val]) => (
                                            <label key={key} className="flex items-center gap-4 p-4 bg-[var(--card-alt-color)] border border-[var(--border-muted)] rounded-none cursor-pointer hover:bg-[var(--card-alt-color)]/80 transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={val as boolean}
                                                    onChange={e => setCompletionChecklist({ ...completionChecklist, [key]: e.target.checked })}
                                                    className="w-6 h-6 rounded-none text-blue-600 bg-black/20 border-[var(--border-color)]"
                                                />
                                                <span className="text-sm font-bold text-[var(--text-muted)] group-hover:text-white capitalize tracking-tight">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
                                        <h3 className="font-black text-lg text-white uppercase tracking-widest">Fotos Depois da Limpeza</h3>
                                        <button
                                            type="button"
                                            onClick={() => setExtraCompletionPhotos(extraCompletionPhotos + 1)}
                                            className="flex items-center gap-1 px-3 py-2 bg-[var(--card-alt-color)] border border-[var(--border-muted)] hover:border-green-600 hover:text-green-600 text-[var(--text-muted)] transition-all text-[10px] font-black uppercase tracking-widest rounded-none"
                                        >
                                            <Plus size={12} /> Adicionar Foto
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Array.from({ length: 6 + extraCompletionPhotos }, (_, i) => i).map(i => (
                                            <label key={i} className="aspect-video bg-[var(--card-alt-color)] rounded-none flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-muted)] hover:border-green-600 transition-colors cursor-pointer group relative overflow-hidden">
                                                {completionPhotos && completionPhotos[i] ? (
                                                    <div className="absolute inset-0">
                                                        <img src={completionPhotos[i]} alt={`Foto ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Camera className="text-white" size={28} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Camera className="text-[var(--text-faint)] group-hover:text-green-600 transition-colors" size={32} />
                                                        <span className="text-[9px] text-[var(--text-faint)] mt-2 uppercase font-black tracking-widest">Foto {i + 1}</span>
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
                                                                const { uploadImage } = await import('../../utils/storageUtils');
                                                                const publicUrl = await uploadImage(compressedBase64);
                                                                const newPhotos = [...(completionPhotos || [])];
                                                                newPhotos[i] = publicUrl;
                                                                setCompletionPhotos(newPhotos);
                                                            } catch (err) {
                                                                console.error("Erro ao processar foto:", err);
                                                                showToast("Erro ao enviar a foto. Verifique sua conexão.", 'error');
                                                            }
                                                        }
                                                    }}
                                                />
                                            </label>
                                        ))}
                                    </div>

                                    <div className="space-y-4 pt-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="flex items-center gap-3 p-4 bg-blue-600/10 border border-blue-600/20 rounded-none cursor-pointer">
                                                <input type="checkbox" checked={newService.nfpaCompliance} onChange={e => setNewService({ ...newService, nfpaCompliance: e.target.checked })} className="w-5 h-5 rounded-none text-blue-600" />
                                                <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Compliance NFPA</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-none cursor-pointer">
                                                <input type="checkbox" checked={newService.fireHazard} onChange={e => setNewService({ ...newService, fireHazard: e.target.checked })} className="w-5 h-5 rounded-none text-red-500" />
                                                <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Risco Incêndio</span>
                                            </label>
                                        </div>

                                        <div className="mt-4">
                                            <textarea
                                                value={newService.notes || ''}
                                                onChange={e => setNewService({ ...newService, notes: e.target.value })}
                                                placeholder="Anotações para o relatório final..."
                                                className="w-full p-6 bg-[var(--card-alt-color)] border border-[var(--border-muted)] rounded-none text-white focus:ring-2 focus:ring-blue-600 text-sm min-h-[120px] outline-none"
                                            ></textarea>
                                        </div>

                                        <button
                                            onClick={handleCompleteService}
                                            disabled={!Object.values(completionChecklist).every(v => v)}
                                            className="w-full py-5 bg-blue-600 text-[var(--bg-color)] rounded-none font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all disabled:opacity-20 disabled:grayscale"
                                        >
                                            Finalizar e Emitir Laudo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[var(--card-color)] p-10 rounded-none border border-[var(--border-muted)] blue-glow">
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2 italic">{user?.name || 'Comandante'}, pronto para o próximo check?</h2>
                            <p className="text-[var(--text-muted)] font-bold uppercase text-xs tracking-widest">Nenhuma tarefa ativa no momento. Inicie no menu Clientes.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
