import React, { useState } from 'react';
import { Shield, Download, History, Database, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SecurityBackupProps {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const SecurityBackup: React.FC<SecurityBackupProps> = ({ showToast }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleDownloadBackup = async () => {
        setIsExporting(true);
        try {
            // Fetch all core data for export
            const [clientsRes, servicesRes, settingsRes] = await Promise.all([
                supabase.from('clients').select('*'),
                supabase.from('services').select('*'),
                supabase.from('settings').select('*')
            ]);

            const exportData = {
                exportedAt: new Date().toISOString(),
                clients: clientsRes.data || [],
                services: servicesRes.data || [],
                settings: settingsRes.data || []
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `de_hood_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export error:", error);
            showToast("Erro ao exportar dados.", 'error');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-[var(--card-color)] p-10 rounded-none border border-[var(--border-muted)] shadow-2xl overflow-hidden relative emerald-glow">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-none -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 max-w-2xl">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-none flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                        <Shield size={32} />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-4 text-white uppercase italic">Infraestrutura & Resiliência Cloud</h2>
                    <p className="text-[var(--text-muted)] leading-relaxed mb-8 font-bold uppercase text-[10px] tracking-widest">
                        Dados persistidos via Supabase (AWS Engine), protegidos por criptografia AES-256 e redundância geográfica automática.
                        Backups de segurança podem ser extraídos manualmente em formato estruturado.
                    </p>
                    <button
                        onClick={handleDownloadBackup}
                        disabled={isExporting}
                        className="flex items-center gap-4 bg-emerald-500 hover:bg-emerald-400 text-[var(--bg-color)] px-10 py-5 rounded-none font-black uppercase italic tracking-widest transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                    >
                        <Download size={20} />
                        {isExporting ? 'Processando...' : 'Extrair Snapshot JSON'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl emerald-glow">
                    <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-muted)] pb-4">
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-none flex items-center justify-center text-blue-500">
                            <History size={24} />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Protocolo de Retenção</h3>
                    </div>
                    <ul className="space-y-6">
                        <li className="flex gap-4">
                            <div className="w-2 h-2 bg-emerald-500 rounded-none mt-1.5 shrink-0 shadow-lg shadow-emerald-500/20 animate-pulse"></div>
                            <div>
                                <div className="font-black text-white text-xs uppercase italic">Backup Automatizado Diário</div>
                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Snapshot às 04:00 AM UTC-3</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="w-2 h-2 bg-emerald-500 rounded-none mt-1.5 shrink-0 shadow-lg shadow-emerald-500/20"></div>
                            <div>
                                <div className="font-black text-white text-xs uppercase italic">Políticas de Persistência</div>
                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Janela de retenção de 7 estados ativos</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl emerald-glow">
                    <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-muted)] pb-4">
                        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-none flex items-center justify-center text-amber-500">
                            <ShieldAlert size={24} />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Health Monitor</h3>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-[var(--bg-color)] border border-[var(--border-muted)] rounded-none">
                        <div className="flex items-center gap-4">
                            <Database size={20} className="text-[var(--text-faint)]" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Core Database Engine</span>
                        </div>
                        <span className="px-4 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded-none border border-emerald-500/20 uppercase tracking-widest">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityBackup;
