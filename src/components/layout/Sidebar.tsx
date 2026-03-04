import React from 'react';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    BarChart3,
    Shield,
    Code,
    FileText,
    LogOut,
    CalendarDays
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    user: any;
    handleLogout: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    settings?: Record<string, string>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, handleLogout, isOpen, setIsOpen, settings }) => {

    const handleNavClick = (tabId: string) => {
        setActiveTab(tabId);
        setIsOpen(false);
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#151619] text-white flex flex-col border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-bottom border-white/10 flex flex-col items-center justify-center">
                    <img
                        src={settings?.logo_image || "https://drive.google.com/uc?export=download&id=18_iHEeJb9kpZV-MOYDKrwSlT6jIKRjvl"}
                        alt="Logo da Empresa"
                        className="h-12 md:h-16 w-auto max-w-[12rem] object-contain mb-2 drop-shadow-md"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => handleNavClick('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/60 hover:bg-white/5'}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Dashboard</span>
                    </button>
                    {user.role === 'admin' && (
                        <button
                            onClick={() => handleNavClick('calendar')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'calendar' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/60 hover:bg-white/5'}`}
                        >
                            <CalendarDays size={20} />
                            <span className="font-medium">Calendário & Rotas</span>
                        </button>
                    )}
                    <button
                        onClick={() => handleNavClick('clients')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'clients' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/60 hover:bg-white/5'}`}
                    >
                        <Users size={20} />
                        <span className="font-medium">{user.role === 'admin' ? 'Gestão de Clientes' : 'Iniciar Serviço'}</span>
                    </button>
                    {user.role === 'technician' && (
                        <button
                            onClick={() => handleNavClick('services')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'services' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/60 hover:bg-white/5'}`}
                        >
                            <ClipboardList size={20} />
                            <span className="font-medium">Meus Serviços</span>
                        </button>
                    )}
                    {user.role === 'admin' && (
                        <>
                            <button
                                onClick={() => handleNavClick('team')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'team' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/60 hover:bg-white/5'}`}
                            >
                                <Users size={20} />
                                <span className="font-medium">Equipe</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('performance')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'performance' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/60 hover:bg-white/5'}`}
                            >
                                <BarChart3 size={20} />
                                <span className="font-medium">Desempenho</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('services')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'services' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/60 hover:bg-white/5'}`}
                            >
                                <ClipboardList size={20} />
                                <span className="font-medium">Histórico Geral</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('security')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'security' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/60 hover:bg-white/5'}`}
                            >
                                <Shield size={20} />
                                <span className="font-medium">Segurança & Backup</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('automation')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'automation' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/60 hover:bg-white/5'}`}
                            >
                                <Code size={20} />
                                <span className="font-medium">Automação Script</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('guide')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'guide' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/60 hover:bg-white/5'}`}
                            >
                                <FileText size={20} />
                                <span className="font-medium">Guia de Configuração</span>
                            </button>
                        </>
                    )}
                </nav>

                <div className="p-6 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
