import React from 'react';
import { Search, Plus } from 'lucide-react';

interface HeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    user: any;
    setShowClientModal: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm, user, setShowClientModal }) => {
    return (
        <header className="py-4 md:h-20 bg-white border-b border-black/5 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 space-y-4 md:space-y-0 sticky top-0 z-10">
            <div className="flex items-center gap-4 bg-black/5 px-4 py-2 rounded-full w-full md:w-96">
                <Search size={18} className="text-black/40" />
                <input
                    type="text"
                    placeholder="Buscar restaurante, técnico ou cidade..."
                    className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
                <div className="text-left md:text-right mr-2">
                    <div className="text-sm font-bold">{user.name}</div>
                    <div className="text-[10px] text-black/40 uppercase font-bold tracking-wider">{user.role}</div>
                </div>
                {user.role === 'admin' && (
                    <button
                        onClick={() => setShowClientModal(true)}
                        className="bg-emerald-500 text-white px-4 md:px-6 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 text-sm md:text-base whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Novo Cliente
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
