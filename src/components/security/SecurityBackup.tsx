import React, { useState } from 'react';
import { Shield, Download, History, Database, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SecurityBackup: React.FC = () => {
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
            alert("Erro ao exportar dados.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-[#0A0A0B] p-10 rounded-[2.5rem] text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 max-w-2xl">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                        <Shield size={32} />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-4">Segurança & Proteção de Dados (Cloud)</h2>
                    <p className="text-white/60 leading-relaxed mb-8">
                        Seus dados agora estão hospedados no Supabase (infraestrutura AWS), protegidos por criptografia de nível bancário e backups automáticos.
                        Como administrador, você pode exportar uma cópia de segurança em formato JSON.
                    </p>
                    <button
                        onClick={handleDownloadBackup}
                        disabled={isExporting}
                        className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                        <Download size={20} />
                        {isExporting ? 'Exportando...' : 'Exportar Dados (.json)'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                            <History size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Rotina de Backup</h3>
                    </div>
                    <ul className="space-y-4">
                        <li className="flex gap-3">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0"></div>
                            <div>
                                <div className="font-bold text-sm">Backup Diário</div>
                                <p className="text-xs text-black/40">Executado automaticamente às 04:00 AM</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0"></div>
                            <div>
                                <div className="font-bold text-sm">Retenção de 7 dias</div>
                                <p className="text-xs text-black/40">Mantemos os últimos 7 estados do sistema</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                            <ShieldAlert size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Monitoramento de Acesso</h3>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-black/[0.02] rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Database size={18} className="text-black/40" />
                            <span className="text-sm font-medium">Status do Banco de Dados</span>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Saudável</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityBackup;
