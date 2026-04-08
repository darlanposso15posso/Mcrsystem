import React from 'react';
import { Plus, Menu } from 'lucide-react';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

interface HeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    user: any;
    setShowClientModal: (show: boolean) => void;
    settings?: Record<string, string>;
    segmentLabels?: SegmentLabels;
    activeTab?: string;
    onMenuOpen?: () => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm, user, setShowClientModal, settings, segmentLabels, activeTab = 'dashboard', onMenuOpen }) => {
    const currentLang = (settings?.['language'] as Language) || 'pt';
    const t = translations[currentLang];

    const pageTitles: Record<string, string> = {
        dashboard: 'Painel',
        calendar: 'Calendário',
        leads: 'Prospecção',
        clients: 'Estabelecimentos',
        team: 'Equipe',
        performance: 'Performance',
        services: 'Histórico',
        automation: 'Automação',
        guide: 'Guia NFPA',
        security: 'Segurança',
        billing: 'Assinatura',
        admin_settings: 'Configurações',
    };
    const currentPageTitle = pageTitles[activeTab] ?? 'MCR';

    return (
        <header className="h-[54px] bg-white border-b border-black/[0.07] flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-30">
            {/* Left: hamburger + breadcrumb */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuOpen}
                    className="md:hidden p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-[6px] transition-colors"
                >
                    <Menu size={20} />
                </button>
                <span className="text-[13px] text-gray-500 hidden md:block">
                    MCR / <span className="text-gray-900 font-medium">{currentPageTitle}</span>
                </span>
                <span className="text-[13px] text-gray-900 font-medium md:hidden">{currentPageTitle}</span>
            </div>

            {/* Right: actions + user info */}
            <div className="flex items-center gap-3">
                {user.role === 'admin' && (
                    <button
                        onClick={() => setShowClientModal(true)}
                        className="flex items-center gap-1.5 px-3 py-[6px] bg-[#1A56DB] hover:bg-[#1545B8] text-white rounded-[7px] text-[12px] font-medium transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">
                            {segmentLabels ? `Novo ${segmentLabels.client}` : (
                                currentLang === 'pt' ? 'Novo Cliente' :
                                    currentLang === 'en' ? 'New Client' :
                                        currentLang === 'es' ? 'Nuevo Cliente' :
                                            currentLang === 'fr' ? 'Nouveau Client' : 'Nuovo Cliente'
                            )}
                        </span>
                        <span className="sm:hidden">Novo</span>
                    </button>
                )}
                <div className="flex items-center gap-2 pl-3 border-l border-black/[0.07]">
                    <div className="text-right hidden md:block">
                        <div className="text-[12px] font-medium text-gray-800 leading-tight">{user.name}</div>
                        <div className="text-[10px] text-gray-400 capitalize">{user.role}</div>
                    </div>
                    <div className="w-[28px] h-[28px] rounded-full bg-[#EEF4FF] border border-[#1A56DB]/20 flex items-center justify-center text-[10px] font-semibold text-[#1A56DB] shrink-0">
                        {(user.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
