import React, { useState, useEffect } from 'react';
import { Mail, Clock, Send, Zap, Settings, MessageCircle, Key, Phone, Image as ImageIcon, CheckSquare, X, Loader2 } from 'lucide-react';
import { PRE_CLEANING_CATEGORIES, MANDATORY_PRE_CLEANING_CHECKLIST } from '../../utils/preCleaningChecklist';
import { supabase } from '../../lib/supabase';

interface AutomationProps {
    user: any;
    settings: Record<string, string>;
    fetchData: () => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    upsertSetting: (key: string, value: string, companyId?: string) => Promise<{ error: any }>;
}

const Automation: React.FC<AutomationProps> = ({ user, settings, fetchData, showToast, upsertSetting }) => {
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
            const companyId = user?.companyId || 'personal';
            const { error } = await upsertSetting(key, value, companyId);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error("Error saving setting:", error);
            showToast("Erro ao salvar configuração.", 'error');
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
            <div className="flex justify-between items-center bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Configurações de Automação</h2>
                    <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-1">Smart Engine v1.0 • Núcleo Central</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-blue-600 text-[var(--bg-color)] px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest border border-blue-500 shadow-lg shadow-blue-600/20">
                        <Zap size={14} fill="currentColor" />
                        Status: Online
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                        <div className="flex justify-between items-start mb-8 border-b border-[var(--border-muted)] pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600/10 border border-blue-600/20 rounded-none flex items-center justify-center text-blue-600">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">Notificações por E-mail</h3>
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Disparos automáticos de lembrete</p>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-[var(--card-alt-color)]/80 rounded-none transition-colors border border-[var(--border-muted)]">
                                <Settings size={20} className="text-[var(--text-muted)]" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-8 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-color)]">
                                <div className="flex items-center gap-3 mb-6">
                                    <Clock size={16} className="text-blue-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Regra Logística de Disparo</span>
                                </div>
                                <div className="text-sm text-[var(--text-muted)] leading-relaxed flex items-center gap-4 flex-wrap">
                                    <span className="font-bold uppercase text-[10px] tracking-tight">Executar lembrete automático</span>
                                    <div className="flex items-center gap-3 bg-[var(--bg-color)] px-4 py-2 rounded-none border border-blue-600 shadow-lg shadow-blue-600/10">
                                        <input
                                            type="number"
                                            value={reminderDays}
                                            onChange={(e) => setReminderDays(e.target.value)}
                                            onBlur={() => handleSaveSettings('reminder_days_before', reminderDays)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSettings('reminder_days_before', reminderDays)}
                                            className="w-12 text-center bg-transparent border-none p-0 font-black text-blue-600 focus:ring-0 appearance-none text-xl italic"
                                            min="1"
                                            max="365"
                                        />
                                        <span className="font-black text-blue-600 text-[10px] uppercase tracking-widest">dias</span>
                                    </div>
                                    <span className="font-bold uppercase text-[10px] tracking-tight">antes da data prevista ("Next Service").</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-blue-600/5 rounded-none border border-blue-600/10">
                                    <div className="text-[9px] font-black uppercase text-blue-600 tracking-widest mb-1">Último Ciclo</div>
                                    <div className="font-black text-white italic">Hoje às 09:00 AM</div>
                                </div>
                                <div className="p-6 bg-blue-500/5 rounded-none border border-blue-500/10">
                                    <div className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-1">Próximo Ciclo</div>
                                    <div className="font-black text-white italic">Amanhã às 09:00 AM</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                        <div className="flex justify-between items-start mb-8 border-b border-[var(--border-muted)] pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600/10 border border-blue-600/20 rounded-none flex items-center justify-center text-blue-600">
                                    <MessageCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">Meta / WhatsApp API</h3>
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Integração oficial Business Cloud</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest flex items-center gap-2 mb-3">
                                    <Key size={14} className="text-blue-600" /> WhatsApp API Secret Token
                                </label>
                                <input
                                    type="password"
                                    placeholder="EAAGX..."
                                    value={whatsappToken}
                                    onChange={e => setWhatsappToken(e.target.value)}
                                    onBlur={() => handleSaveSettings('whatsapp_token', whatsappToken)}
                                    className="w-full p-5 bg-[var(--bg-color)] rounded-none border border-[var(--border-muted)] focus:border-blue-600/50 focus:ring-0 text-xs font-mono text-[var(--text-primary)]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest flex items-center gap-2 mb-3">
                                    <Phone size={14} className="text-blue-600" /> Business Phone ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="123456789012345"
                                    value={whatsappPhoneId}
                                    onChange={e => setWhatsappPhoneId(e.target.value)}
                                    onBlur={() => handleSaveSettings('whatsapp_phone_id', whatsappPhoneId)}
                                    className="w-full p-5 bg-[var(--bg-color)] rounded-none border border-[var(--border-muted)] focus:border-blue-600/50 focus:ring-0 text-xs font-mono text-[var(--text-primary)]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                        <h3 className="font-black text-white uppercase italic tracking-tight mb-8 border-b border-[var(--border-muted)] pb-4">Registros de Atividade</h3>
                        <div className="space-y-4">
                            {[
                                { event: 'Disparo SMTP realizado', client: 'The Burger King', time: 'Hoje, 09:02 AM' },
                                { event: 'Disparo Mailer concluído', client: 'Pizza Hut Express', time: 'Hoje, 09:01 AM' },
                                { event: 'Sincronização Cronjob', client: 'Cloud Database', time: 'Hoje, 04:00 AM' }
                            ].map((log, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] hover:bg-[var(--card-alt-color)]/80 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 bg-blue-600 rounded-none shadow-lg shadow-blue-600/20 animate-pulse"></div>
                                        <div>
                                            <div className="text-xs font-black text-white uppercase italic">{log.event}</div>
                                            <div className="text-[10px] text-[var(--text-faint)] font-bold uppercase tracking-widest mt-0.5">{log.client}</div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest">{log.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-500/5 p-8 rounded-none border border-amber-500/20 shadow-2xl blue-glow-hover transition-all">
                        <div className="flex justify-between items-start mb-8 border-b border-amber-500/10 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-none flex items-center justify-center text-amber-500">
                                    <MessageCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-amber-500 uppercase italic tracking-tight text-lg">Mural de Avisos (Admin Broadcast)</h3>
                                    <p className="text-[10px] text-amber-500/40 uppercase font-bold tracking-widest">Este alerta será exibido no topo do app de todos os técnicos.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                placeholder="Digite aqui o aviso importante para a equipe..."
                                value={adminBroadcastNote}
                                onChange={e => setAdminBroadcastNote(e.target.value)}
                                onBlur={() => handleSaveSettings('admin_broadcast_note', adminBroadcastNote)}
                                className="w-full p-6 bg-[var(--bg-color)] rounded-none border border-amber-500/20 focus:border-amber-500 focus:ring-0 text-xs min-h-[140px] text-[var(--text-primary)]"
                            ></textarea>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin text-amber-500" />
                                            <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Sincronizando...</span>
                                        </>
                                    ) : (
                                        <span className="text-[9px] text-amber-500/40 font-black uppercase tracking-widest">Salvo na nuvem</span>
                                    )}
                                </div>
                                <p className="text-[9px] text-amber-500/40 font-black uppercase tracking-widest">Persistence Enabled</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                        <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-muted)] pb-4">
                            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-none flex items-center justify-center text-purple-500">
                                <ImageIcon size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-white uppercase italic tracking-tight text-lg">Identidade Visual</h3>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Logo da plataforma</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--border-color)] rounded-none bg-[var(--bg-color)] hover:border-blue-600/50 transition-all relative cursor-pointer overflow-hidden group">
                                {logoImage ? (
                                    <img src={logoImage} alt="Logo" className="h-24 w-auto object-contain z-10" />
                                ) : (
                                    <div className="text-center z-10 text-[var(--text-faint)] group-hover:text-blue-600 transition-colors">
                                        <ImageIcon size={40} className="mx-auto mb-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest block">Carregar Logo</span>
                                        <span className="text-[9px] uppercase tracking-tighter">PNG, JPG ou SVG</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                />
                                {isSaving && (
                                    <div className="absolute inset-0 bg-[var(--bg-color)]/80 backdrop-blur-sm z-30 flex items-center justify-center">
                                        <Loader2 size={24} className="animate-spin text-blue-600" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--bg-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                        <h3 className="font-black text-white uppercase italic tracking-tight mb-6 text-sm">Operações de Manutenção</h3>
                        <div className="space-y-4">
                            <button className="w-full h-14 flex items-center justify-between px-6 bg-[var(--card-alt-color)] hover:bg-blue-600 hover:text-[var(--bg-color)] border border-[var(--border-muted)] transition-all group rounded-none">
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                    <Send size={18} className="text-blue-600 group-hover:text-[var(--bg-color)]" />
                                    <span>Testar SMTP</span>
                                </div>
                                <Zap size={14} className="text-white/10 group-hover:text-[var(--bg-color)]" />
                            </button>
                            <button className="w-full h-14 flex items-center justify-between px-6 bg-[var(--card-alt-color)] hover:bg-blue-500 hover:text-[var(--bg-color)] border border-[var(--border-muted)] transition-all group rounded-none">
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                    <Settings size={18} className="text-blue-500 group-hover:text-[var(--bg-color)]" />
                                    <span>Sync DB Schema</span>
                                </div>
                                <Zap size={14} className="text-white/10 group-hover:text-[var(--bg-color)]" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Checklist Section Moved or Restyled */}
            <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                <div className="flex justify-between items-start mb-8 border-b border-[var(--border-muted)] pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-none flex items-center justify-center text-indigo-500">
                            <CheckSquare size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-white uppercase italic tracking-tight text-lg">Pre-Cleaning Verification Protocol</h3>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Protocolo obrigatório para início das operações</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {MANDATORY_PRE_CLEANING_CHECKLIST.map((item, idx) => (
                        <div key={item.id} className="flex items-start gap-5 p-6 bg-[var(--card-alt-color)] border border-[var(--border-muted)] group hover:border-indigo-500/30 transition-all rounded-none">
                            <div className="w-8 h-8 rounded-none bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-black text-xs shrink-0 italic">
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-black text-white uppercase italic tracking-tight">{item.label}</div>
                                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tight mt-1 leading-relaxed">{item.description}</div>
                            </div>
                            <div className="ml-auto">
                                <div className="px-2 py-1 bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase tracking-widest rounded-none border border-indigo-500/20">
                                    Strict
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Automation;
