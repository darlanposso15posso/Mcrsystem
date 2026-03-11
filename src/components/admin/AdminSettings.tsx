import React, { useState, useEffect } from 'react';
import { Settings, Globe, Shield, Bell, Layout, Briefcase, Zap, Loader2, Save, Database, Key, Palette, Cpu, Layers, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../translations';
import { User } from '../../types';

interface AdminSettingsProps {
    user: User | null;
    settings: Record<string, string>;
    fetchData: () => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    upsertSetting: (key: string, value: string, companyId?: string) => Promise<{ error: any }>;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ user, settings, fetchData, showToast, upsertSetting }) => {
    const [currentLanguage, setCurrentLanguage] = useState<Language>((settings['language'] as Language) || 'pt');
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<'general' | 'localization' | 'security' | 'business' | 'branding' | 'segment' | 'team'>('localization');

    // Branding States
    const [primaryColor, setPrimaryColor] = useState(settings['primary_color'] || '#3b82f6');
    const [bgColor, setBgColor] = useState(settings['bg_color'] || '#020617');
    const [cardColor, setCardColor] = useState(settings['card_color'] || '#111827');
    const [sidebarBg, setSidebarBg] = useState(settings['sidebar_bg'] || '#111827');
    const [headerBg, setHeaderBg] = useState(settings['header_bg'] || 'rgba(17, 24, 39, 0.8)');
    const [textColor, setTextColor] = useState(settings['text_primary'] || '#f9fafb');
    const [fontFamily, setFontFamily] = useState(settings['font_family'] || '"Inter", sans-serif');
    const [glowIntensity, setGlowIntensity] = useState(settings['glow_intensity'] || '0.12');
    const [currentSegment, setCurrentSegment] = useState(settings['segment'] || 'hood_cleaning');

    const themes = [
        {
            id: 'cyber_hud',
            label: 'Cyber HUD',
            colors: {
                primary_color: '#3b82f6',
                bg_color: '#020617',
                card_color: '#111827',
                sidebar_bg: '#111827',
                header_bg: 'rgba(17, 24, 39, 0.8)',
                text_primary: '#f9fafb',
                font_family: '"Inter", sans-serif'
            }
        },
        {
            id: 'emerald_bio',
            label: 'Emerald Bio',
            colors: {
                primary_color: '#10b981',
                bg_color: '#064e3b',
                card_color: '#065f46',
                sidebar_bg: '#064e3b',
                header_bg: 'rgba(6, 78, 59, 0.8)',
                text_primary: '#ecfdf5',
                font_family: '"Plus Jakarta Sans", sans-serif'
            }
        },
        {
            id: 'sunset_gold',
            label: 'Sunset Gold',
            colors: {
                primary_color: '#f59e0b',
                bg_color: '#451a03',
                card_color: '#78350f',
                sidebar_bg: '#451a03',
                header_bg: 'rgba(69, 26, 3, 0.8)',
                text_primary: '#fffbeb',
                font_family: '"Montserrat", sans-serif'
            }
        },
        {
            id: 'deep_ocean',
            label: 'Deep Ocean',
            colors: {
                primary_color: '#06b6d4',
                bg_color: '#083344',
                card_color: '#155e75',
                sidebar_bg: '#083344',
                header_bg: 'rgba(8, 51, 68, 0.8)',
                text_primary: '#ecfeff',
                font_family: '"Roboto", sans-serif'
            }
        }
    ];

    const fonts = [
        { label: 'Inter (Modern)', value: '"Inter", sans-serif' },
        { label: 'Roboto (Clean)', value: '"Roboto", sans-serif' },
        { label: 'JetBrains Mono (Tech)', value: '"JetBrains Mono", monospace' },
        { label: 'Montserrat (Premium)', value: '"Montserrat", sans-serif' },
        { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", sans-serif' }
    ];

    const applyTheme = async (themeColors: Record<string, string>) => {
        setIsSaving(true);
        try {
            const companyId = user?.companyId || 'personal';
            const promises = Object.entries(themeColors).map(([key, value]) => 
                upsertSetting(key, value, companyId)
            );
            await Promise.all(promises);
            
            // Update local state
            if (themeColors.primary_color) setPrimaryColor(themeColors.primary_color);
            if (themeColors.bg_color) setBgColor(themeColors.bg_color);
            if (themeColors.card_color) setCardColor(themeColors.card_color);
            if (themeColors.sidebar_bg) setSidebarBg(themeColors.sidebar_bg);
            if (themeColors.header_bg) setHeaderBg(themeColors.header_bg);
            if (themeColors.text_primary) setTextColor(themeColors.text_primary);
            if (themeColors.font_family) setFontFamily(themeColors.font_family);
            
            await fetchData();
            showToast("Theme applied successfully!", 'success');
        } catch (error) {
            console.error("Error applying theme:", error);
            showToast("Error applying theme.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const t = translations[currentLanguage];

    const languages = [
        { id: 'pt', label: 'Português', flag: '🇧🇷' },
        { id: 'en', label: 'English', flag: '🇺🇸' },
        { id: 'es', label: 'Español', flag: '🇪🇸' },
        { id: 'fr', label: 'Français', flag: '🇫🇷' },
        { id: 'it', label: 'Italiano', flag: '🇮🇹' }
    ];

    const handleSaveSetting = async (key: string, value: string) => {
        setIsSaving(true);
        try {
            const companyId = user?.companyId || 'personal';
            const { error } = await upsertSetting(key, value, companyId);
            if (error) throw error;
            // setSettings in the hook already updates local state, but we might need to re-fetch complex derivations
            await fetchData();
        } catch (error) {
            console.error("Error saving setting:", error);
            showToast("Error saving setting.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const sections = [
        { id: 'localization', label: t.language, icon: Globe },
        { id: 'branding', label: 'Branding', icon: Palette },
        { id: 'team', label: 'Equipe', icon: Users },
        // Segment locked to Hood Cleaning for test phase
        // { id: 'segment', label: 'Segmento', icon: Layers },
        { id: 'general', label: t.general, icon: Layout },
        { id: 'business', label: t.business_rules, icon: Briefcase },
        { id: 'security', label: t.security, icon: Shield },
    ];

    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [isLoadingTeam, setIsLoadingTeam] = useState(false);

    useEffect(() => {
        if (activeSection === 'team') {
            fetchTeam();
        }
    }, [activeSection]);

    const fetchTeam = async () => {
        setIsLoadingTeam(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('company_id', user?.companyId);
            
            if (error) throw error;
            setTeamMembers(data || []);
        } catch (error) {
            console.error("Error fetching team:", error);
            showToast("Erro ao carregar equipe.", 'error');
        } finally {
            setIsLoadingTeam(false);
        }
    };

    const copyInviteLink = () => {
        const baseUrl = window.location.origin;
        const inviteUrl = `${baseUrl}?invite=${user?.companyId}&role=technician`;
        navigator.clipboard.writeText(inviteUrl);
        showToast("Link de convite copiado!", 'success');
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow border-l-4 border-l-blue-600">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">{t.admin_settings}</h2>
                    <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-1">Central de Comando e Governança Global</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[var(--bg-color)] text-blue-600 px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest border border-blue-600/20">
                        <Zap size={14} fill="currentColor" />
                        Node: {currentLanguage.toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    {sections.map(section => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id as any)}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-none transition-all text-[10px] font-black uppercase tracking-widest border ${activeSection === section.id
                                    ? 'bg-blue-600 text-[var(--bg-color)] border-blue-500 shadow-lg shadow-blue-600/20'
                                    : 'bg-[#151619] text-[var(--text-muted)] border-[var(--border-muted)] hover:border-[var(--border-color)] hover:text-white'
                                    }`}
                            >
                                <Icon size={18} />
                                {section.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-8">
                    {activeSection === 'localization' && (
                        <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow animate-fade-in">
                            <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-muted)] pb-4">
                                <div className="w-12 h-12 bg-blue-600/10 border border-blue-600/20 rounded-none flex items-center justify-center text-blue-600">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">{t.language}</h3>
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Selecione o idioma operacional do sistema</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {languages.map(lang => (
                                    <button
                                        key={lang.id}
                                        onClick={() => {
                                            setCurrentLanguage(lang.id as Language);
                                            handleSaveSetting('language', lang.id);
                                        }}
                                        className={`flex items-center justify-between p-6 rounded-none border transition-all ${currentLanguage === lang.id
                                            ? 'bg-[var(--card-alt-color)] border-blue-600 text-white'
                                            : 'bg-black/20 border-[var(--border-muted)] text-[var(--text-muted)] hover:border-[var(--border-color)]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{lang.flag}</span>
                                            <span className="text-xs font-black uppercase tracking-widest">{lang.label}</span>
                                        </div>
                                        {currentLanguage === lang.id && (
                                            <div className="w-2 h-2 bg-blue-600 rounded-none shadow-lg shadow-blue-600/50"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'team' && (
                        <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-[var(--border-muted)] pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600/10 border border-blue-600/20 rounded-none flex items-center justify-center text-blue-600">
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white uppercase italic tracking-tight text-lg">Gestão de Equipe</h3>
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Controle seus técnicos e acessos</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={copyInviteLink}
                                    className="px-6 py-3 bg-blue-600 text-slate-900 border border-blue-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                                >
                                    <Key size={14} />
                                    Copiar Link de Convite (Técnico)
                                </button>
                            </div>

                            {isLoadingTeam ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {teamMembers.length === 0 ? (
                                        <div className="text-center p-12 border border-dashed border-[var(--border-muted)]">
                                            <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest">Nenhum técnico cadastrado ainda.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {teamMembers.map((member) => (
                                                <div key={member.id} className="flex items-center justify-between p-4 bg-black/20 border border-[var(--border-muted)] hover:border-blue-600/30 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-blue-600/5 rounded-none border border-blue-600/10 flex items-center justify-center text-blue-600 text-xs font-black">
                                                            {member.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-white uppercase italic">{member.name}</h4>
                                                            <p className="text-[9px] text-[var(--text-muted)] font-bold tracking-widest uppercase">{member.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest border ${
                                                            member.role === 'admin' 
                                                                ? 'bg-blue-600/10 border-blue-600/30 text-blue-500' 
                                                                : 'bg-green-600/10 border-green-600/30 text-green-500'
                                                        }`}>
                                                            {member.role === 'admin' ? 'Admin' : 'Técnico'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-8 p-6 bg-blue-600/5 border border-blue-600/10 text-center">
                                <p className="text-[10px] text-blue-600/70 font-black uppercase tracking-widest leading-relaxed">
                                    Envie o link de convite para seus técnicos. Ao se cadastrarem pelo link, eles serão vinculados automaticamente à sua empresa.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeSection === 'branding' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Theme Presets */}
                            <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                                <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-muted)] pb-4">
                                    <div className="w-12 h-12 bg-purple-600/10 border border-purple-600/20 rounded-none flex items-center justify-center text-purple-600">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white uppercase italic tracking-tight text-lg">Theme Presets</h3>
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Combinações geradas pelo sistema em um clique</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {themes.map(theme => (
                                        <button
                                            key={theme.id}
                                            onClick={() => applyTheme(theme.colors)}
                                            className="group relative flex flex-col items-center justify-center p-6 bg-black/40 border border-[var(--border-muted)] hover:border-blue-600 transition-all rounded-none"
                                        >
                                            <div className="flex gap-1 mb-3">
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary_color }}></div>
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.bg_color }}></div>
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.sidebar_bg }}></div>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-blue-500">{theme.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Customization */}
                            <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                                <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-muted)] pb-4">
                                    <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/20 rounded-none flex items-center justify-center text-pink-500">
                                        <Palette size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white uppercase italic tracking-tight text-lg">Fine-Tuning HUD</h3>
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Ajuste cada detalhe da sua interface futurista</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest block mb-3">Font Philosophy</label>
                                            <select
                                                value={fontFamily}
                                                onChange={(e) => {
                                                    setFontFamily(e.target.value);
                                                    handleSaveSetting('font_family', e.target.value);
                                                }}
                                                className="w-full bg-black/40 border border-[var(--border-muted)] text-[var(--text-primary)] px-4 py-3 rounded-none text-xs font-bold focus:border-blue-600/50 outline-none"
                                            >
                                                {fonts.map(font => (
                                                    <option key={font.value} value={font.value}>{font.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest block mb-3">Primary Pulse</label>
                                            <div className="flex gap-4 items-center">
                                                <input
                                                    type="color"
                                                    value={primaryColor}
                                                    onChange={(e) => {
                                                        setPrimaryColor(e.target.value);
                                                        handleSaveSetting('primary_color', e.target.value);
                                                    }}
                                                    className="w-12 h-12 bg-transparent border-none cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={primaryColor}
                                                    readOnly
                                                    className="bg-black/20 border border-[var(--border-muted)] px-4 py-2 rounded-none text-[10px] font-mono text-[var(--text-muted)] flex-1"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest block mb-3">Core Background</label>
                                            <div className="flex gap-4 items-center">
                                                <input
                                                    type="color"
                                                    value={bgColor}
                                                    onChange={(e) => {
                                                        setBgColor(e.target.value);
                                                        handleSaveSetting('bg_color', e.target.value);
                                                    }}
                                                    className="w-12 h-12 bg-transparent border-none cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={bgColor}
                                                    readOnly
                                                    className="bg-black/20 border border-[var(--border-muted)] px-4 py-2 rounded-none text-[10px] font-mono text-[var(--text-muted)] flex-1"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest block mb-3">Sidebar Shield</label>
                                            <div className="flex gap-4 items-center">
                                                <input
                                                    type="color"
                                                    value={sidebarBg}
                                                    onChange={(e) => {
                                                        setSidebarBg(e.target.value);
                                                        handleSaveSetting('sidebar_bg', e.target.value);
                                                    }}
                                                    className="w-12 h-12 bg-transparent border-none cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={sidebarBg}
                                                    readOnly
                                                    className="bg-black/20 border border-[var(--border-muted)] px-4 py-2 rounded-none text-[10px] font-mono text-[var(--text-muted)] flex-1"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest block mb-3">Text Dominance</label>
                                            <div className="flex gap-4 items-center">
                                                <input
                                                    type="color"
                                                    value={textColor}
                                                    onChange={(e) => {
                                                        setTextColor(e.target.value);
                                                        handleSaveSetting('text_primary', e.target.value);
                                                    }}
                                                    className="w-12 h-12 bg-transparent border-none cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={textColor}
                                                    readOnly
                                                    className="bg-black/20 border border-[var(--border-muted)] px-4 py-2 rounded-none text-[10px] font-mono text-[var(--text-muted)] flex-1"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest block mb-3">Glow Intensity: {glowIntensity}</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={glowIntensity}
                                                onChange={(e) => {
                                                    setGlowIntensity(e.target.value);
                                                    handleSaveSetting('glow_intensity', e.target.value);
                                                }}
                                                className="w-full h-2 bg-[var(--card-alt-color)] rounded-none appearance-none cursor-pointer accent-blue-600"
                                            />
                                            <div className="flex justify-between mt-2">
                                                <span className="text-[8px] text-[var(--text-faint)] font-black uppercase tracking-widest">Stealth Node</span>
                                                <span className="text-[8px] text-[var(--text-faint)] font-black uppercase tracking-widest">Hyper Drive</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'segment' && (
                        <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow animate-fade-in">
                            <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-muted)] pb-4">
                                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-none flex items-center justify-center text-cyan-500">
                                    <Layers size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">Segment Engine</h3>
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Adapte o sistema para diferentes indústrias</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { id: 'hood_cleaning', label: 'Hood Cleaning', icon: '♨️' },
                                    { id: 'hvac', label: 'HVAC & Maintenance', icon: '❄️' },
                                    { id: 'security', label: 'Physical Security', icon: '🛡️' },
                                    { id: 'pest_control', label: 'Pest Control', icon: '🐜' }
                                ].map(seg => (
                                    <button
                                        key={seg.id}
                                        onClick={() => {
                                            setCurrentSegment(seg.id);
                                            handleSaveSetting('segment', seg.id);
                                        }}
                                        className={`flex flex-col gap-4 p-8 rounded-none border transition-all text-left ${currentSegment === seg.id
                                            ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                                            : 'bg-black/20 border-[var(--border-muted)] text-[var(--text-muted)] hover:border-[var(--border-color)]'
                                            }`}
                                    >
                                        <span className="text-3xl">{seg.icon}</span>
                                        <div>
                                            <span className="text-xs font-black uppercase tracking-widest block">{seg.label}</span>
                                            <p className="text-[8px] mt-1 opacity-60 uppercase">Auto-relabeling active</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'general' && (
                        <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow animate-fade-in">
                            <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-muted)] pb-4">
                                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-none flex items-center justify-center text-blue-500">
                                    <Layout size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">{t.general}</h3>
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Identidade Visual e Parâmetros Base</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest block mb-3">App Name</label>
                                    <input
                                        type="text"
                                        defaultValue={settings['app_name'] || 'D&E Hood Cleaning'}
                                        onBlur={(e) => handleSaveSetting('app_name', e.target.value)}
                                        className="w-full p-5 bg-[var(--bg-color)] rounded-none border border-[var(--border-muted)] focus:border-blue-600/50 focus:ring-0 text-xs text-[var(--text-primary)] font-bold uppercase italic"
                                    />
                                </div>
                                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-none">
                                    <p className="text-[10px] text-blue-500/60 font-black uppercase tracking-widest leading-relaxed">
                                        As configurações de logo e avisos globais foram migradas para o painel de Automação para manter a integridade operacional.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'business' && (
                        <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow animate-fade-in">
                            <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-muted)] pb-4">
                                <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-none flex items-center justify-center text-purple-500">
                                    <Briefcase size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">{t.business_rules}</h3>
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Logística de Ciclo e Notificações</p>
                                </div>
                            </div>

                            <div className="p-8 bg-purple-500/5 border border-purple-500/10 rounded-none text-center">
                                <Zap size={40} className="text-purple-500 mx-auto mb-4 opacity-20" />
                                <h4 className="text-sm font-black text-white uppercase italic mb-2 tracking-widest">Console de Automação Ativo</h4>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest max-w-md mx-auto leading-relaxed">
                                    As regras de disparo (19 dias) e checklists pré-limpeza estão sendo gerenciadas pelo Smart Engine no menu lateral de Automação.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow animate-fade-in">
                            <div className="flex items-center gap-4 mb-8 border-b border-[var(--border-muted)] pb-4">
                                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-none flex items-center justify-center text-amber-500">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">{t.security}</h3>
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Criptografia e Integridade de Dados</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-6 bg-[var(--bg-color)] border border-[var(--border-muted)] rounded-none">
                                    <div className="flex items-center gap-4">
                                        <Database size={20} className="text-amber-500" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Auto-Backup Snapshot</span>
                                    </div>
                                    <button className="px-6 py-2 bg-amber-500 text-[var(--bg-color)] text-[10px] font-black rounded-none border border-amber-400 uppercase tracking-widest hover:bg-amber-400 transition-all">
                                        Run Now
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-[var(--bg-color)] border border-[var(--border-muted)] rounded-none opacity-50 cursor-not-allowed">
                                    <div className="flex items-center gap-4">
                                        <Key size={20} className="text-[var(--text-faint)]" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Master API Key Rotation</span>
                                    </div>
                                    <div className="px-4 py-1 bg-[var(--card-alt-color)] text-[var(--text-faint)] text-[9px] font-black rounded-none border border-[var(--border-color)] uppercase tracking-widest">Locked</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-center">
                {isSaving && (
                    <div className="flex items-center gap-2 bg-blue-600 text-[var(--bg-color)] px-6 py-3 rounded-none font-black uppercase tracking-widest shadow-xl shadow-blue-600/20">
                        <Loader2 size={16} className="animate-spin" />
                        {t.saving}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSettings;
