import React from 'react';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    BarChart3,
    Shield,
    FileText,
    LogOut,
    CalendarDays,
    Settings,
    Zap,
    BookOpen,
    Phone,
    CreditCard,
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

function SidebarGroupLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-[10px] font-medium tracking-[0.07em] text-[#6B7280]/50 uppercase px-2.5 pt-3 pb-1 select-none">
            {children}
        </div>
    );
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, handleLogout, isOpen, setIsOpen, settings, segmentLabels }) => {
    const currentLang = (settings?.['language'] as Language) || 'pt';
    const t = translations[currentLang];

    const handleNavClick = (tabId: string) => {
        setActiveTab(tabId);
        setIsOpen(false);
    };

    const initials = (user?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    const NavItem = ({ tabId, icon, label }: { tabId: string; icon: React.ReactNode; label: string }) => {
        const isActive = activeTab === tabId;
        return (
            <button
                onClick={() => handleNavClick(tabId)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-[7px] text-[12.5px] mb-[1px] transition-colors text-left ${
                    isActive
                        ? 'bg-white/[0.08] text-[#F3F4F6]'
                        : 'text-[#6B7280] hover:bg-white/[0.05] hover:text-[#D1D5DB]'
                }`}
            >
                <span className={`shrink-0 ${isActive ? 'opacity-100 text-[#F3F4F6]' : 'opacity-60'}`}>
                    {icon}
                </span>
                <span className="flex-1 font-medium">{label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#E8A020] shrink-0" />}
            </button>
        );
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed md:sticky top-0 left-0 h-screen w-[220px] min-w-[220px] bg-[#111318] flex flex-col border-r border-white/[0.06] z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* Logo */}
                <div className="px-4 py-5 flex items-center gap-2.5 border-b border-white/[0.06] relative">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute right-3 top-3 md:hidden p-1 text-[#6B7280] hover:text-white"
                    >
                        <X size={16} />
                    </button>
                    <div className="w-[30px] h-[30px] bg-[#E8A020] rounded-[8px] flex items-center justify-center text-white font-bold text-[13px] shrink-0">
                        D
                    </div>
                    <div>
                        <div className="text-[13px] font-semibold text-gray-100 tracking-tight leading-tight">
                            {settings?.company_name || 'D&E Hood'}
                        </div>
                        <div className="text-[10px] text-[#6B7280] mt-0.5">MCR Platform</div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-2 px-2">
                    <NavItem tabId="dashboard" icon={<LayoutDashboard size={15} />} label={t.dashboard} />

                    {user.role === 'admin' && (
                        <>
                            <NavItem tabId="calendar"  icon={<CalendarDays size={15} />} label={t.calendar} />
                            <NavItem tabId="leads"     icon={<Phone size={15} />}        label={t.leads} />

                            <SidebarGroupLabel>Operações</SidebarGroupLabel>
                            <NavItem tabId="clients"     icon={<Users size={15} />}       label={segmentLabels?.clients || t.clients} />
                            <NavItem tabId="team"        icon={<Users size={15} />}       label={t.team} />
                            <NavItem tabId="performance" icon={<BarChart3 size={15} />}   label={t.performance} />
                            <NavItem tabId="services"    icon={<ClipboardList size={15} />} label={segmentLabels?.services || t.services} />

                            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
                            <NavItem tabId="automation"     icon={<Zap size={15} />}      label={t.automation} />
                            <NavItem tabId="guide"          icon={<BookOpen size={15} />}  label={t.guide} />
                            <NavItem tabId="security"       icon={<Shield size={15} />}    label={t.security} />
                            <NavItem tabId="billing"        icon={<CreditCard size={15} />} label="Assinatura" />
                            <NavItem tabId="admin_settings" icon={<Settings size={15} />}  label={t.admin_settings} />
                        </>
                    )}
                </nav>

                {/* User footer */}
                <div className="p-2 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] cursor-default">
                        <div className="w-[26px] h-[26px] rounded-full bg-[#1E3048] border border-white/10 flex items-center justify-center text-[10px] font-semibold text-[#93B4D8] shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[12px] text-[#9CA3AF] truncate">{user?.name || 'Usuário'}</div>
                            <div className="text-[10px] text-[#6B7280] capitalize">{user?.role || 'Admin'}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-[7px] text-[12px] text-[#E05252]/60 hover:text-[#E05252] hover:bg-[#E05252]/5 transition-colors mt-0.5"
                    >
                        <LogOut size={14} className="shrink-0" />
                        <span>{t.logout}</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
