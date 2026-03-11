import React from 'react';
import { Search, Plus } from 'lucide-react';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

interface HeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    user: any;
    setShowClientModal: (show: boolean) => void;
    settings?: Record<string, string>;
    segmentLabels?: SegmentLabels;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm, user, setShowClientModal, settings, segmentLabels }) => {
    const currentLang = (settings?.['language'] as Language) || 'pt';
    const t = translations[currentLang];
    return (
        <header className="py-4 md:h-20 vibrant-glass-header flex flex-col md:flex-row items-center justify-between px-4 md:px-8 space-y-4 md:space-y-0 sticky top-0 z-10">
            <div className="flex-1 hidden md:block">
                {/* Space for logo or breadcrumb if needed, keeping it empty to push content to center */}
            </div>

            <div className="flex items-center justify-center flex-1">
                {user.role === 'admin' && (
                    <button
                        onClick={() => setShowClientModal(true)}
                        className="bg-blue-600 text-white px-8 py-2 rounded-none font-black flex items-center gap-2 hover:bg-blue-500 transition-all shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] text-sm md:text-base whitespace-nowrap uppercase tracking-widest"
                    >
                        <Plus size={18} />
                        {segmentLabels ? `Novo ${segmentLabels.client}` : (
                            currentLang === 'pt' ? 'Novo Cliente' :
                                currentLang === 'en' ? 'New Client' :
                                    currentLang === 'es' ? 'Nuevo Cliente' :
                                        currentLang === 'fr' ? 'Nouveau Client' : 'Nuovo Cliente'
                        )}
                    </button>
                )}
            </div>

            <div className="flex items-center justify-end flex-1 gap-4">
                <div className="flex items-center gap-3 pl-4 border-l border-[var(--border-muted)]">
                    <div className="text-right hidden md:block">
                        <div className="text-xs font-black uppercase tracking-tight text-[var(--text-primary)]">{user.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest italic">{user.role}</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
