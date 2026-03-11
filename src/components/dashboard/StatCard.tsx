import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    isWarning?: boolean;
    color?: 'emerald' | 'blue' | 'purple' | 'red' | 'amber' | 'indigo' | 'cyan';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, isWarning, color = 'blue' }) => {
    const colorClasses = {
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        red: 'text-red-500 bg-red-500/10 border-red-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20'
    };

    const activeColor = colorClasses[color] || colorClasses.blue;

    return (
        <div className={`p-6 rounded-none bg-[var(--card-color)] border ${isWarning ? 'border-amber-500/30' : 'border-[var(--border-muted)]'} blue-glow-hover transition-all relative overflow-hidden group`}>
            {/* Ambient background glow matching the color */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${activeColor.split(' ')[0]}`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-12 h-12 flex items-center justify-center rounded-none bg-[var(--card-alt-color)] border border-[var(--border-muted)] ${activeColor.split(' ')[0]}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`px-2 py-1 rounded-none text-[8px] font-black uppercase tracking-widest ${activeColor}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div className="text-3xl font-black tracking-tight mb-1 text-[var(--text-primary)] relative z-10">{value}</div>
            <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest relative z-10">{title}</div>
        </div>
    );
};

export default StatCard;
