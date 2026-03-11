import React from 'react';
import { BookOpen, Server, Database, Mail, Terminal, Globe } from 'lucide-react';

const ConfigGuide: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-none text-[10px] font-black uppercase tracking-widest border border-blue-500/20 shadow-lg shadow-blue-500/5">
                    Protocolo de Documentação Técnica
                </div>
                <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">Manutenção do Sistema</h2>
                <p className="text-[var(--text-muted)] text-sm font-bold uppercase tracking-[0.2em] max-w-2xl mx-auto">
                    Referência de engenharia para gestão e escalabilidade da plataforma D&E Hood Cleaning.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <div className="bg-[var(--card-color)] p-10 rounded-none border border-[var(--border-muted)] shadow-2vxl blue-glow">
                        <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-none flex items-center justify-center text-blue-500 mb-8 shadow-lg shadow-blue-500/10">
                            <Server size={28} />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tight mb-6">Arquitetura de Núcleo (Backend)</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <Terminal size={18} className="mt-1 text-blue-500" />
                                <div className="text-sm">
                                    <span className="font-black text-white uppercase tracking-widest text-[10px]">Node.js Engine</span>
                                    <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase mt-1 leading-relaxed">Cluster de API REST com tratamento assíncrono de jobs.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Database size={18} className="mt-1 text-blue-500" />
                                <div className="text-sm">
                                    <span className="font-black text-white uppercase tracking-widest text-[10px]">Cloud Database (Supabase)</span>
                                    <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase mt-1 leading-relaxed">Persistência relacional protegida por RLS (Row Level Security).</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--card-color)] p-10 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                        <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-none flex items-center justify-center text-blue-500 mb-8 shadow-lg shadow-blue-500/10">
                            <Mail size={28} />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tight mb-6">Motor de Notificações</h3>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-relaxed mb-8">
                            Utilizamos o protocolo <strong>SMTP</strong> via Nodemailer para transações críticas de e-mail e lembretes operacionais.
                        </p>
                        <div className="bg-[var(--bg-color)] p-6 rounded-none border border-[var(--border-muted)] font-mono text-[10px] text-blue-500 space-y-2">
                            <div className="opacity-40"># SMTP CONFIGURATION</div>
                            <div>SMTP_RELAY=smtp.gmail.com</div>
                            <div>SMTP_PORT_TLS=587</div>
                            <div>SMTP_AUTH=enabled</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-[var(--card-color)] p-10 rounded-none border border-[var(--border-muted)] shadow-2xl blue-glow">
                        <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-none flex items-center justify-center text-purple-500 mb-8 shadow-lg shadow-purple-500/10">
                            <Globe size={28} />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tight mb-6">Stack Visual (Frontend)</h3>
                        <ul className="space-y-4">
                            {[
                                'React 18 + Vite (Runtime)',
                                'Tailwind CSS (Squared Design)',
                                'Lucide Premium Icons',
                                'Recharts Data Visualization'
                            ].map((tech, i) => (
                                <li key={i} className="flex items-center gap-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                    <div className="w-2 h-2 bg-purple-500 rounded-none shadow-lg shadow-purple-500/20"></div>
                                    <span>{tech}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-blue-500 p-10 rounded-none text-[var(--bg-color)] shadow-2xl blue-glow relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-none -mr-16 -mt-16 blur-2xl"></div>
                        <div className="flex items-center gap-4 mb-6 border-b border-[var(--bg-color)]/10 pb-4">
                            <BookOpen size={28} />
                            <h3 className="text-xl font-black uppercase italic tracking-tighter italic">Compliance NFPA 96</h3>
                        </div>
                        <p className="text-[var(--bg-color)]/60 text-[10px] font-black uppercase tracking-widest leading-relaxed italic">
                            O ecossistema foi projetado para conformidade integral com os requisitos de segurança contra incêndio da NFPA, garantindo auditoria completa em cada serviço.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigGuide;
