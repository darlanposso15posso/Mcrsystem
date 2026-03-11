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
    CalendarDays,
    Settings,
    MessageSquare,
    Zap,
    BookOpen,
    Phone,
    X
} from 'lucide-react';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    user: any;
    handleLogout: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    settings?: Record<string, string>;
    segmentLabels?: SegmentLabels;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, handleLogout, isOpen, setIsOpen, settings, segmentLabels }) => {
    const currentLang = (settings?.['language'] as Language) || 'pt';
    const t = translations[currentLang];

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

            <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[var(--sidebar-bg)] text-[var(--text-primary)] flex flex-col border-r border-[var(--border-muted)] z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[4px_0_24px_rgba(0,0,0,0.2)]`}>
                <div className="p-6 border-b border-[var(--border-muted)] flex flex-col items-center justify-center relative">
                    {/* Mobile Close Button */}
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute right-4 top-4 md:hidden p-1 text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                    <img
                        src={settings?.logo_image || "https://drive.google.com/uc?export=download&id=18_iHEeJb9kpZV-MOYDKrwSlT6jIKRjvl"}
                        alt="Logo"
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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'dashboard' ? 'bg-[#FACC15] text-[#111827] font-black rounded-lg shadow-sm border-none mx-2' : 'text-slate-400 hover:bg-white/10 hover:text-white rounded-lg mx-2'}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.dashboard}</span>
                    </button>
                    {user.role === 'admin' && (
                        <>
                            <button
                                onClick={() => handleNavClick('calendar')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'calendar' ? 'bg-[#FACC15] text-[#111827] font-black rounded-lg shadow-sm border-none mx-2' : 'text-slate-400 hover:bg-white/10 hover:text-white rounded-lg mx-2'}`}
                            >
                                <CalendarDays size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.calendar}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('leads')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'leads' ? 'bg-[#FACC15] text-[#111827] font-black rounded-lg shadow-sm border-none mx-2' : 'text-slate-400 hover:bg-white/10 hover:text-white rounded-lg mx-2'}`}
                            >
                                <Phone size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.leads}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('clients')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'clients' ? 'bg-[#FACC15] text-[#111827] font-black rounded-lg shadow-sm border-none mx-2' : 'text-slate-400 hover:bg-white/10 hover:text-white rounded-lg mx-2'}`}
                            >
                                <Users size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{segmentLabels?.clients || t.clients}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('team')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'team' ? 'bg-[#FACC15] text-[#111827] font-black rounded-lg shadow-sm border-none mx-2' : 'text-slate-400 hover:bg-white/10 hover:text-white rounded-lg mx-2'}`}
                            >
                                <Users size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.team}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('performance')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'performance' ? 'bg-[#FACC15] text-[#111827] font-black rounded-lg shadow-sm border-none mx-2' : 'text-slate-400 hover:bg-white/10 hover:text-white rounded-lg mx-2'}`}
                            >
                                <BarChart3 size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.performance}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('services')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'services' ? 'bg-[#FACC15] text-[#111827] font-black rounded-lg shadow-sm border-none mx-2' : 'text-slate-400 hover:bg-white/10 hover:text-white rounded-lg mx-2'}`}
                            >
                                <ClipboardList size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{segmentLabels?.services || t.services}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('automation')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'automation' ? 'bg-[#FACC15] text-[#111827] font-black rounded-lg shadow-sm border-none mx-2' : 'text-slate-400 hover:bg-white/10 hover:text-white rounded-lg mx-2'}`}
                            >
                                <Zap size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.automation}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('guide')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'guide' ? 'bg-[#FACC15] text-[#111827] font-black rounded-lg shadow-sm border-none mx-2' : 'text-slate-400 hover:bg-white/10 hover:text-white rounded-lg mx-2'}`}
                            >
                                <BookOpen size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.guide}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('security')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'security' ? 'bg-[#FACC15] text-[#111827] font-black rounded-lg shadow-sm border-none mx-2' : 'text-slate-400 hover:bg-white/10 hover:text-white rounded-lg mx-2'}`}
                            >
                                <Shield size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.security}</span>
                            </button>
                        </>
                    )}
                </nav>

                <div className="px-4 py-6 space-y-4 border-t border-slate-800 bg-black/20">
                    {user.role === 'admin' && (
                        <button
                            onClick={() => handleNavClick('admin_settings')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'admin_settings' ? 'bg-[#FACC15] text-[#111827] font-black rounded-lg shadow-sm border-none mx-2' : 'text-slate-400 hover:bg-white/10 hover:text-white rounded-lg mx-2'}`}
                        >
                            <Settings size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t.admin_settings}</span>
                        </button>
                    )}
                    
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-none text-red-500/60 hover:text-red-400 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        <LogOut size={20} />
                        <span>{t.logout}</span>
                    </button>

                    <div className="pt-4 border-t border-white/5 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                        <img src="/mcr-logo.png" alt="MCR Logo" className="h-5 w-auto" />
                        <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400">Powered by MCR Platform</span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
