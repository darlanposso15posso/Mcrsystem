import React, { useState } from 'react';
import { 
    CheckCircle2, 
    Shield, 
    Zap, 
    Clock, 
    Smartphone, 
    ArrowRight, 
    BarChart3, 
    Users, 
    Calendar, 
    Activity, 
    Camera, 
    Globe,
    ChevronRight,
    Star,
    Layers,
    FileSearch,
    Cpu
} from 'lucide-react';

interface LandingPageProps {
    onLogin: () => void;
    onStartTrial: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onStartTrial }) => {
    const [activeTab, setActiveTab] = useState<'management' | 'compliance' | 'reports'>('management');
    const logoUrl = "/mcr-logo.png";

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
            {/* BACKGROUND DECORATION */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/5 blur-[100px] rounded-full"></div>
            </div>

            {/* HEADER */}
            <nav className="border-b border-white/5 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3 group">
                            <div className="relative">
                                <img src={logoUrl} alt="Logo" className="h-10 w-auto relative z-10 transition-transform group-hover:scale-110" />
                                <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full scale-0 group-hover:scale-150 transition-transform duration-500"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-xl tracking-tighter text-white leading-none">MCR</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 leading-none mt-1">SaaS Platform</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-6">
                            <button onClick={onLogin} className="text-slate-400 hover:text-white font-bold text-sm transition-all uppercase tracking-widest flex items-center gap-2">
                                Login <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button onClick={onStartTrial} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative bg-slate-950 hover:bg-slate-900 text-white font-black px-6 py-2.5 rounded-full shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs border border-white/10">
                                    Trial Grátis
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-24 pb-32 lg:pt-36 flex flex-col items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-500/5 text-emerald-400 font-black text-[10px] mb-12 border border-emerald-500/20 uppercase tracking-[0.2em] animate-fade-in shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Management, Compliance & Reports Authority
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9] animate-slide-up">
                        A Nova Era do <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 drop-shadow-sm">
                            Hood Cleaning.
                        </span>
                    </h1>
                    
                    <p className="mt-8 text-xl md:text-2xl text-slate-400 max-w-4xl mx-auto mb-12 leading-relaxed font-medium animate-slide-up" style={{ animationDelay: '100ms' }}>
                        Transforme sua operação com tecnologia de conformidade **NFPA**. 
                        Relatórios inteligentes, gestão de técnicos e automação de campo em uma única plataforma premium.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <button onClick={onStartTrial} className="group relative w-full sm:w-auto overflow-hidden rounded-2xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="relative flex items-center justify-center gap-3 text-white font-black text-lg px-10 py-5 rounded-2xl shadow-2xl transition-all active:scale-95 uppercase tracking-widest">
                                Iniciar Jornada <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                        <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white font-black text-lg px-10 py-5 rounded-2xl border border-white/10 transition-all active:scale-95 uppercase tracking-widest backdrop-blur-sm">
                            Tour do Sistema <Activity size={22} />
                        </button>
                    </div>

                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '400ms' }}>
                        {[
                            { label: 'NFPA Compliance', icon: <Shield size={16} /> },
                            { label: 'Instant Reports', icon: <BarChart3 size={16} /> },
                            { label: 'Cloud Secured', icon: <Globe size={16} /> },
                            { label: 'Mobile Ready', icon: <Smartphone size={16} /> },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="text-emerald-500 opacity-60">{stat.icon}</div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* FUTURISTIC SHOWCASE */}
                    <div className="mt-32 relative max-w-6xl mx-auto animate-slide-up" style={{ animationDelay: '500ms' }}>
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-emerald-500/10 blur-[150px] -z-10 rounded-full"></div>
                        
                        <div className="relative group">
                            {/* Glass Container */}
                            <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-4 border border-white/10 shadow-[0_0_80px_rgba(16,185,129,0.15)] overflow-hidden">
                                <div className="bg-slate-950/80 rounded-[2rem] overflow-hidden border border-white/5 relative aspect-video group-hover:border-emerald-500/20 transition-colors duration-500">
                                    <img 
                                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070" 
                                        className="w-full h-full object-cover opacity-20 filter grayscale hover:grayscale-0 hover:opacity-40 transition-all duration-1000"
                                        alt="MCR Dashboard Preview"
                                    />
                                    
                                    {/* Floating UI Elements */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
                                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-bounce cursor-pointer hover:scale-110 transition-transform">
                                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-slate-950 ml-1"></div>
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-[0.4em] text-white">Watch Platform Demo</span>
                                    </div>

                                    {/* Abstract Data Decoration */}
                                    <div className="absolute top-8 left-8 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hidden md:block">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] font-black text-white tracking-widest uppercase">System Uptime</span>
                                        </div>
                                        <div className="h-12 w-32 flex items-end gap-1">
                                            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                                <div key={i} className="flex-1 bg-emerald-500/40 rounded-sm" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PILLARS OF AUTHORITY */}
            <section className="py-32 bg-slate-950 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-24">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 uppercase italic">
                                Os Pilares da <br />
                                <span className="text-emerald-500 uppercase not-italic">Autoridade.</span>
                            </h2>
                            <p className="text-xl text-slate-400 font-medium">MCR não é apenas um software, é o seu novo padrão de excelência em conformidade e relatórios.</p>
                        </div>
                        <div className="flex gap-4 p-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <button onClick={() => setActiveTab('management')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'management' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>Management</button>
                            <button onClick={() => setActiveTab('compliance')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'compliance' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>Compliance</button>
                            <button onClick={() => setActiveTab('reports')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>Reports</button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-12">
                            {activeTab === 'management' && (
                                <div className="animate-fade-in">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-8 border border-emerald-500/20">
                                        <Cpu size={32} />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">Gestão Inteligente</h3>
                                    <p className="text-lg text-slate-400 leading-relaxed mb-8">
                                        Controle total sobre clientes, técnicos e agendamentos. Nosso motor de IA prevê datas de serviço e automatiza o fluxo de trabalho para que você foque no crescimento.
                                    </p>
                                    <ul className="space-y-4">
                                        {['Automação de Recorrência', 'Controle de Equipes em Campo', 'CRM Especializado'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-white font-bold text-sm">
                                                <CheckCircle2 size={18} className="text-emerald-500" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {activeTab === 'compliance' && (
                                <div className="animate-fade-in">
                                    <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-500 mb-8 border border-cyan-500/20">
                                        <Shield size={32} />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">Rigor na Conformidade</h3>
                                    <p className="text-lg text-slate-400 leading-relaxed mb-8">
                                        Checklists digitais baseados nos padrões NFPA 96. Garanta que cada centímetro limpo esteja documentado e dentro das normas de segurança internacionais.
                                    </p>
                                    <ul className="space-y-4">
                                        {['Padrão NFPA 96 Integrado', 'Garantia de Segurança contra Incêndio', 'Certificações Digitais'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-white font-bold text-sm">
                                                <CheckCircle2 size={18} className="text-cyan-500" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {activeTab === 'reports' && (
                                <div className="animate-fade-in">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-8 border border-blue-500/20">
                                        <FileSearch size={32} />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">Relatórios de Elite</h3>
                                    <p className="text-lg text-slate-400 leading-relaxed mb-8">
                                        Gere relatórios fotográficos de "Antes e Depois" em segundos. Documentação visual inegável que fecha contratos e mantém a confiança dos seus clientes.
                                    </p>
                                    <ul className="space-y-4">
                                        {['Geração de PDF Automática', 'Histórico Fotográfico em Nuvem', 'Personalização com sua Marca'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-white font-bold text-sm">
                                                <CheckCircle2 size={18} className="text-blue-500" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-10 bg-emerald-500/10 blur-[80px] -z-10 rounded-full"></div>
                            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 aspect-square flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <img 
                                    src={logoUrl} 
                                    alt="MCR Mark" 
                                    className="h-48 w-auto relative z-10 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12" 
                                />
                                <div className="absolute bottom-12 right-12 flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] opacity-40">
                                    <div className="w-12 h-[1px] bg-emerald-500"></div> MCR Certified
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUSTED BY PROS */}
            <section className="py-24 border-y border-white/5 bg-slate-950/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.8em] mb-12 block">Built for the Best in Industry</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                        {/* Mock Logos */}
                        <div className="flex items-center justify-center font-black text-2xl italic tracking-tighter">HOODPRO</div>
                        <div className="flex items-center justify-center font-black text-2xl italic tracking-tighter">CERTIFIED CLEAN</div>
                        <div className="flex items-center justify-center font-black text-2xl italic tracking-tighter">SAFETY FIRST</div>
                        <div className="flex items-center justify-center font-black text-2xl italic tracking-tighter">NFPA PARTNERS</div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="relative py-40 overflow-hidden text-center">
                <div className="absolute inset-0 bg-emerald-500/5 -z-10 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_70%)]"></div>
                
                <div className="max-w-4xl mx-auto px-4">
                    <div className="inline-flex items-center gap-2 text-emerald-500 mb-8 p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                        <Star size={20} fill="currentColor" />
                        <Star size={20} fill="currentColor" />
                        <Star size={20} fill="currentColor" />
                        <Star size={20} fill="currentColor" />
                        <Star size={20} fill="currentColor" />
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter uppercase italic">Assuma o controle total hoje.</h2>
                    <p className="text-xl md:text-2xl text-slate-400 mb-16 font-medium leading-relaxed max-w-3xl mx-auto">
                        Pare de perder tempo com planilhas e relatórios manuais. Mude para a plataforma que coloca o seu negócio no piloto automático.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button onClick={onStartTrial} className="group relative w-full sm:w-auto overflow-hidden rounded-2xl">
                            <div className="absolute inset-0 bg-emerald-600"></div>
                            <div className="relative flex items-center justify-center gap-3 text-slate-950 font-black text-xl px-12 py-6 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all group-hover:scale-105 active:scale-95 uppercase tracking-[0.2em] italic">
                                Criar Minha Conta <ChevronRight size={24} />
                            </div>
                        </button>
                    </div>
                    <p className="mt-8 text-slate-600 font-bold uppercase text-[10px] tracking-widest">Setup instantâneo • Sem cartão • 15 dias grátis</p>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-950 text-slate-600 py-24 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
                        <div className="flex items-center gap-3">
                            <img src={logoUrl} alt="Logo" className="h-8 w-auto opacity-50 grayscale" />
                            <span className="font-black text-slate-500 tracking-tighter text-xl">MCR PLATFORM</span>
                        </div>
                        <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em]">
                            <a href="#" className="hover:text-emerald-500 transition-colors">Products</a>
                            <a href="#" className="hover:text-emerald-500 transition-colors">Pricing</a>
                            <a href="#" className="hover:text-emerald-500 transition-colors">Terms</a>
                            <a href="#" className="hover:text-emerald-500 transition-colors">Privacy</a>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 pt-12 border-t border-white/5">
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400 opacity-60">
                                © {new Date().getFullYear()} MCR - Management, Compliance & Reports. 
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/40">
                                Official Compliance Management Platform
                            </p>
                        </div>
                        <a href="https://mcrsystem.online" className="text-slate-500 hover:text-emerald-500 font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2 group">
                            mcrsystem.online <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            </footer>

            {/* CSS ANIMATIONS */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 1s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
            ` }} />
        </div>
    );
};

export default LandingPage;
