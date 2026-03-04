import React, { useState, useEffect } from 'react';
import { Mail, Clock, Send, Zap, Settings, MessageCircle, Key, Phone, Image as ImageIcon, CheckSquare } from 'lucide-react';
import { PRE_CLEANING_CATEGORIES, MANDATORY_PRE_CLEANING_CHECKLIST } from '../../utils/preCleaningChecklist';

interface AutomationProps {
    settings: Record<string, string>;
    fetchData: () => Promise<void>;
}

const Automation: React.FC<AutomationProps> = ({ settings, fetchData }) => {
    const [reminderDays, setReminderDays] = useState(settings['reminder_days_before'] || '19');
    const [whatsappToken, setWhatsappToken] = useState(settings['whatsapp_token'] || '');
    const [whatsappPhoneId, setWhatsappPhoneId] = useState(settings['whatsapp_phone_id'] || '');
    const [logoImage, setLogoImage] = useState(settings['logo_image'] || '');
    const [adminBroadcastNote, setAdminBroadcastNote] = useState(settings['admin_broadcast_note'] || '');
    const [isSaving, setIsSaving] = useState(false);

    // Checklist State
    const [preCleaningChecklist, setPreCleaningChecklist] = useState<string[]>(() => {
        try {
            return JSON.parse(settings['pre_cleaning_checklist'] || '[]');
        } catch {
            return [];
        }
    });

    useEffect(() => {
        if (settings['reminder_days_before']) setReminderDays(settings['reminder_days_before']);
        if (settings['whatsapp_token']) setWhatsappToken(settings['whatsapp_token']);
        if (settings['whatsapp_phone_id']) setWhatsappPhoneId(settings['whatsapp_phone_id']);
        if (settings['logo_image']) setLogoImage(settings['logo_image']);
        if (settings['admin_broadcast_note'] !== undefined) setAdminBroadcastNote(settings['admin_broadcast_note']);
        if (settings['pre_cleaning_checklist']) {
            try { setPreCleaningChecklist(JSON.parse(settings['pre_cleaning_checklist'])); } catch { }
        }
    }, [settings]);

    const handleToggleChecklistItem = (itemId: string) => {
        const newChecklist = preCleaningChecklist.includes(itemId)
            ? preCleaningChecklist.filter(id => id !== itemId)
            : [...preCleaningChecklist, itemId];

        setPreCleaningChecklist(newChecklist);
        handleSaveSettings('pre_cleaning_checklist', JSON.stringify(newChecklist));
    };

    const handleSaveSettings = async (key: string, value: string) => {
        setIsSaving(true);
        try {
            await fetch(`/api/settings/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value })
            });
            await fetchData();
        } catch (error) {
            console.error("Error saving setting:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogoImage(base64String);
                handleSaveSettings('logo_image', base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Automação de Serviços</h2>
                    <p className="text-black/40 text-sm font-medium uppercase tracking-widest mt-1">Smart Engine v1.0</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100">
                        <Zap size={14} />
                        MOTOR ATIVO
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Notificações por E-mail</h3>
                                    <p className="text-xs text-black/40">Automatizadas para o próximo serviço</p>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-black/5 rounded-xl transition-colors">
                                <Settings size={20} className="text-black/40" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-6 bg-black/[0.02] rounded-3xl border border-black/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <Clock size={16} className="text-emerald-500" />
                                    <span className="text-xs font-black uppercase tracking-widest">Regra de Disparo</span>
                                </div>
                                <p className="text-sm text-black/60 leading-relaxed flex items-center gap-2 flex-wrap">
                                    <span>"Enviar lembrete automático</span>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border-2 border-emerald-500 shadow-sm">
                                        <input
                                            type="number"
                                            value={reminderDays}
                                            onChange={(e) => setReminderDays(e.target.value)}
                                            onBlur={() => handleSaveSettings('reminder_days_before', reminderDays)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSettings('reminder_days_before', reminderDays)}
                                            className="w-12 text-center bg-transparent border-none p-0 font-black text-emerald-600 focus:ring-0 appearance-none"
                                            min="1"
                                            max="365"
                                        />
                                        <span className="font-bold text-emerald-800 text-xs">dias</span>
                                    </div>
                                    <span>antes da data prevista para o próximo serviço (`nextServiceDate`)."</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="text-[10px] font-black uppercase text-emerald-600 mb-1">Última Execução</div>
                                    <div className="font-bold text-emerald-900">Hoje às 09:00 AM</div>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="text-[10px] font-black uppercase text-blue-600 mb-1">Próxima Execução</div>
                                    <div className="font-bold text-blue-900">Amanhã às 09:00 AM</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white">
                                    <MessageCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Integração WhatsApp API (Meta)</h3>
                                    <p className="text-xs text-black/40">Tokens oficiais para disparos automatizados 100% invisíveis</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-black/40 tracking-widest flex items-center gap-2 mb-2">
                                    <Key size={14} /> WhatsApp API Token
                                </label>
                                <input
                                    type="password"
                                    placeholder="EAAGX..."
                                    value={whatsappToken}
                                    onChange={e => setWhatsappToken(e.target.value)}
                                    onBlur={() => handleSaveSettings('whatsapp_token', whatsappToken)}
                                    className="w-full p-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-black/40 tracking-widest flex items-center gap-2 mb-2">
                                    <Phone size={14} /> Phone Number ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="123456789012345"
                                    value={whatsappPhoneId}
                                    onChange={e => setWhatsappPhoneId(e.target.value)}
                                    onBlur={() => handleSaveSettings('whatsapp_phone_id', whatsappPhoneId)}
                                    className="w-full p-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                        <h3 className="font-bold text-lg mb-6">Logs de Automação</h3>
                        <div className="space-y-3">
                            {[
                                { event: 'Email enviado', client: 'The Burger King', time: 'Hoje, 09:02 AM' },
                                { event: 'Email enviado', client: 'Pizza Hut Express', time: 'Hoje, 09:01 AM' },
                                { event: 'Sincronização concluída', client: 'Database', time: 'Hoje, 04:00 AM' }
                            ].map((log, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-black/[0.01] rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        <div>
                                            <div className="text-sm font-bold">{log.event}</div>
                                            <div className="text-[10px] text-black/40">{log.client}</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-black/40 uppercase">{log.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white">
                                    <MessageCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-amber-900">Aviso Geral para a Equipe (Mural)</h3>
                                    <p className="text-xs text-amber-900/60">Este recado aparecerá no topo do aplicativo de todos os técnicos logados.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                placeholder="Atenção: A partir da semana que vem, todos devem..."
                                value={adminBroadcastNote}
                                onChange={e => setAdminBroadcastNote(e.target.value)}
                                onBlur={() => handleSaveSettings('admin_broadcast_note', adminBroadcastNote)}
                                className="w-full p-4 bg-white rounded-2xl border-none focus:ring-2 focus:ring-amber-500 text-sm min-h-[120px] shadow-sm"
                            ></textarea>
                            <p className="text-[10px] text-amber-900/60 font-bold uppercase tracking-widest text-right">
                                {isSaving ? 'Salvando...' : 'Salvo automaticamente ao sair do campo'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                                    <CheckSquare size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-indigo-900">Pre-Cleaning Verification Checklist</h3>
                                    <p className="text-xs text-black/40">Este checklist é obrigatório e fixo para todos os técnicos antes de iniciarem a limpeza.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {MANDATORY_PRE_CLEANING_CHECKLIST.map((item, idx) => (
                                <div key={item.id} className="flex items-start gap-4 p-4 bg-black/[0.02] rounded-2xl border border-black/5">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px] shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-black">{item.label}</div>
                                        <div className="text-[10px] text-black/40">{item.description}</div>
                                    </div>
                                    <div className="ml-auto">
                                        <div className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-md border border-indigo-100">
                                            OBRIGATÓRIO
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500">
                                <ImageIcon size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Logo do Sistema</h3>
                                <p className="text-xs text-black/40">Personalize o logotipo padrão da plataforma</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-black/10 rounded-3xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors relative cursor-pointer overflow-hidden group">
                                {logoImage ? (
                                    <img src={logoImage} alt="Logo" className="h-20 w-auto object-contain z-10" />
                                ) : (
                                    <div className="text-center z-10 text-black/40 group-hover:text-emerald-500 transition-colors">
                                        <ImageIcon size={32} className="mx-auto mb-2" />
                                        <span className="text-sm font-bold block">Fazer Upload</span>
                                        <span className="text-xs">PNG, JPG, SVG</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    title="Mudar o logo"
                                />
                                {isSaving && (
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-30 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-500"></div>
                                    </div>
                                )}
                            </div>
                            {logoImage && (
                                <p className="text-[10px] text-center text-black/40 italic">
                                    O logo carregado será exibido no menu e na tela de login.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#151619] p-8 rounded-[2.5rem] text-white">
                        <h3 className="font-bold mb-4">Ações Manuais</h3>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                                <div className="flex items-center gap-3 text-sm">
                                    <Send size={18} className="text-emerald-500" />
                                    <span>Testar SMTP</span>
                                </div>
                                <Zap size={14} className="text-white/20 group-hover:text-emerald-500 transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Automation;
