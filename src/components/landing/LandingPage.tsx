import React, { useState } from 'react';
import { CheckCircle2, Shield, Zap, Clock, Smartphone, ArrowRight, BarChart3, Users, Calendar, Activity, Camera, Globe } from 'lucide-react';

interface LandingPageProps {
    onLogin: () => void;
    onStartTrial: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onStartTrial }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'tech' | 'calendar'>('dashboard');
    const logoUrl = "/mcr-logo.png";

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-600/30 selection:text-blue-900">
            {/* HEADER */}
            <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <img src={logoUrl} alt="Logo" className="h-10 w-auto" />
                            <span className="font-extrabold text-xl tracking-tight text-slate-900 italic">MCR <span className="text-blue-600 text-xs font-black uppercase not-italic">- Compliance</span></span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            <button onClick={onLogin} className="text-slate-600 hover:text-blue-600 font-bold px-4 py-2 transition-colors">
                                Entrar
                            </button>
                            <button onClick={onStartTrial} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-2.5 rounded-full shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-widest text-xs">
                                Teste Grátis
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-[var(--bg-color)] to-[var(--bg-color)] -z-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-bold text-sm mb-8 border border-blue-200">
                        <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                        A solução definitiva para empresas de serviços na rua
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-tight">
                        Gestão, Conformidade e <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
                            Relatórios para Coifas.
                        </span>
                    </h1>
                    <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
                        Certificação NFPA, controle de técnicos, históricos fotográficos e relatórios profissionais.
                        A plataforma definitiva para especialistas em **Hood Cleaning**.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={onStartTrial} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white font-black text-lg px-8 py-4 rounded-full shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-widest">
                            Começar Teste Grátis de 15 Dias <ArrowRight size={20} />
                        </button>
                        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white font-black text-lg px-8 py-4 rounded-full shadow-xl shadow-red-600/20 hover:bg-red-700 hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-widest">
                            Falar com Suporte <Zap size={20} />
                        </button>
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-6 text-sm font-bold text-slate-500 hidden sm:flex">
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-blue-600" /> Sem cartão para testar</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-blue-600" /> Cancelamento a qualquer momento</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-blue-600" /> Setup em 2 minutos</div>
                    </div>

                    {/* INTERACTIVE SHOWCASE */}
                    <div className="mt-24 relative max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6 uppercase italic">
                                Veja o sistema por <span className="text-blue-600 underline decoration-blue-600/30">dentro.</span>
                            </h2>

                            {/* Tabs */}
                            <div className="inline-flex bg-slate-100 p-1.5 rounded-full shadow-inner border border-slate-200 overflow-x-auto max-w-full">
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600'}`}
                                >
                                    Painel Gerencial
                                </button>
                                <button
                                    onClick={() => setActiveTab('calendar')}
                                    className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'calendar' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600'}`}
                                >
                                    Agendamentos
                                </button>
                                <button
                                    onClick={() => setActiveTab('tech')}
                                    className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'tech' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600'}`}
                                >
                                    Visão do Técnico
                                </button>
                            </div>
                        </div>

                        {/* Showcase Window */}
                        <div className="bg-white rounded-2xl md:rounded-t-2xl md:rounded-b-none p-2 md:border-x-[8px] md:border-t-[8px] border-slate-200 shadow-2xl relative">
                            {/* Window Controls */}
                            <div className="hidden md:flex gap-2 mb-3 bg-white items-center px-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            </div>

                            {/* Screen Content */}
                            <div className="bg-slate-50 aspect-[4/3] md:aspect-[16/9] rounded-lg overflow-hidden flex flex-col items-center justify-center border border-slate-200 relative group transition-all duration-500">

                                {activeTab === 'dashboard' && (
                                    <>
                                        <img
                                            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070"
                                            alt="Dashboard Preview"
                                            className="object-cover w-full h-full opacity-40 transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute bottom-6 left-6 md:top-6 md:bottom-auto md:right-6 md:left-auto bg-blue-600 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl flex items-center gap-3 shadow-2xl">
                                            <Activity size={18} /> Controle Total
                                        </div>
                                    </>
                                )}

                                {activeTab === 'calendar' && (
                                    <>
                                        <img
                                            src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&q=80&w=2069"
                                            alt="Calendar Preview"
                                            className="object-cover w-full h-full opacity-40 transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute bottom-6 left-6 md:top-6 md:bottom-auto md:right-6 md:left-auto bg-blue-600 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl flex items-center gap-3 shadow-2xl">
                                            <Calendar size={18} /> Organização Visual
                                        </div>
                                    </>
                                )}

                                {activeTab === 'tech' && (
                                    <>
                                        <img
                                            src="https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&q=80&w=2070"
                                            alt="Tech App Preview"
                                            className="object-cover w-full h-full opacity-40 object-left-top transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute bottom-6 left-6 md:top-6 md:bottom-auto md:right-6 md:left-auto bg-blue-600 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl flex items-center gap-3 shadow-2xl">
                                            <Smartphone size={18} /> Interface Mobile
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES COMPONENT */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase italic">
                            O padrão ouro em <span className="text-blue-600">Certificação.</span>
                        </h2>
                        <p className="mt-4 text-lg text-slate-600 font-bold">Gerencie sua empresa de Limpeza de Coifa com a autoridade que seus clientes exigem.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                            <div className="w-14 h-14 bg-blue-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                <Users size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Gestão de Clientes CRM</h3>
                            <p className="text-slate-600 leading-relaxed font-bold">Cadastre todos os clientes, endereços, e veja exatamente quando foi a última visita. Mantenha os históricos organizados e acessíveis.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                            <div className="w-14 h-14 bg-blue-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                <Calendar size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Calendário Inteligente</h3>
                            <p className="text-slate-600 leading-relaxed font-bold">Controle de agendamentos visuais. Saiba quem está atrasado, quais os serviços de hoje, e projete o faturamento mensal automaticamente.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                            <div className="w-14 h-14 bg-blue-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                <Smartphone size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">App para os Técnicos</h3>
                            <p className="text-slate-600 leading-relaxed font-bold">O seu técnico tem seu próprio login na rua. Ele vê exatamente o que precisa fazer, preenche checklists, tira fotos e encerra o chamado do celular.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                                <Camera size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Relatórios c/ Fotos</h3>
                            <p className="text-slate-600 leading-relaxed font-bold">Geração instantânea de relatórios PDF com fotos de "Antes e Depois" vinculadas à sua logo, prontos para enviar direto ao cliente final.</p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                            <div className="w-14 h-14 bg-blue-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                <Zap size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Automação e Lembretes</h3>
                            <p className="text-slate-600 leading-relaxed font-bold">O sistema se lembra de calcular os próximos agendamentos e cria alertas proativos evitando que você perca prazos dos clientes recorrentes.</p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                                <Shield size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Privacidade Absoluta</h3>
                            <p className="text-slate-600 leading-relaxed font-bold">Arquitetura avançada em Nuvem garante que a sua base de dados e de seus clientes é exclusiva, criptografada e inviolável.</p>
                        </div>
                    </div>
                </div>
            </section>



            {/* CTA FOOTER */}
            <section className="bg-blue-600 py-32 border-t border-blue-500 relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black mb-6 text-white uppercase italic tracking-tighter">Pronto para dar o próximo passo?</h2>
                    <p className="text-xl text-emerald-50 mb-12 font-bold max-w-2xl mx-auto">
                        Junte-se às empresas que modernizaram as suas operações de campo. Crie a sua conta agora e use 100% dos recursos, grátis por 15 dias.
                    </p>
                    <button onClick={onStartTrial} className="bg-white text-blue-600 font-black text-2xl px-12 py-6 rounded-xl shadow-2xl hover:bg-emerald-50 hover:scale-105 transition-all active:scale-95 uppercase tracking-widest italic border-b-4 border-blue-800">
                        Iniciar Meus 15 Dias Grátis
                    </button>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-white text-slate-500 py-16 text-center border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-center items-center gap-3 mb-6">
                        <img src={logoUrl} alt="Logo" className="h-8 w-auto grayscale opacity-50" />
                        <span className="font-extrabold text-slate-900 tracking-widest uppercase text-sm italic">MCR Compliance</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">
                        © {new Date().getFullYear()} MCR - Management, Compliance & Reports. 
                        <br />
                        <a href="https://mcrsystem.online" className="hover:text-blue-600 transition-colors">mcrsystem.online</a>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
