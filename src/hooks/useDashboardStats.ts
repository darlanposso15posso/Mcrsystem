import { useMemo } from 'react';
import { Client, ServiceRecord, Recurrence, DashboardStats } from '../types';

/**
 * Derives dashboard stats and alerts purely from client/service data.
 * No side effects — safe to call on every render.
 */
export function useDashboardStats(
    clients: Client[],
    services: ServiceRecord[],
    settings: Record<string, string>
) {
    const stats = useMemo<DashboardStats>(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const completed = services.filter(s => s.status === 'COMPLETED');
        const nfpaRate = completed.length > 0
            ? Math.round((completed.filter(s => s.nfpaCompliance).length / completed.length) * 100)
            : 0;

        const estCounts: Record<string, number> = {};
        clients.forEach(c => {
            const type = c.establishmentType || 'Restaurante';
            estCounts[type] = (estCounts[type] || 0) + 1;
        });

        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const trends: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            trends[monthNames[d.getMonth()]] = 0;
        }
        services.forEach(s => {
            const d = new Date(s.serviceDate);
            const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
            if (monthDiff >= 0 && monthDiff <= 5) {
                const mName = monthNames[d.getMonth()];
                if (trends[mName] !== undefined) trends[mName]++;
            }
        });

        return {
            activeClients: clients.length,
            servicesThisMonth: services.filter(s => {
                const d = new Date(s.serviceDate);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).length,
            completedServicesTotal: completed.length,
            overdueServices: clients.filter(c => c.nextServiceDate && new Date(c.nextServiceDate) < now).length,
            estimatedRevenue: clients.reduce((sum, c) => {
                const recurrenceMultipliers: Record<string, number> = {
                    [Recurrence.MONTHLY]: 12,
                    [Recurrence.QUARTERLY]: 4,
                    [Recurrence.SEMI_ANNUAL]: 2,
                    'SEMI-ANNUAL': 2,
                    [Recurrence.ANNUAL]: 1,
                };
                const mult = recurrenceMultipliers[c.recurrence] ?? 4;
                return sum + (c.cleaningPrice || 0) * mult;
            }, 0),
            nfpaRate,
            establishmentCounts: Object.entries(estCounts).map(([name, value]) => ({ name, value })),
            monthlyTrends: Object.entries(trends).map(([name, total]) => ({ name, total })),
        };
    }, [clients, services]);

    const alerts = useMemo(() => {
        const reminderDays = parseInt(settings['reminder_days_before'] || '14', 10);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return clients
            .filter(c => {
                if (!c.nextServiceDate) return false;
                const nextDate = new Date(c.nextServiceDate);
                nextDate.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / 86_400_000);
                return diffDays >= 0 && diffDays <= reminderDays;
            })
            .map(c => {
                const nextDate = new Date(c.nextServiceDate!);
                nextDate.setHours(0, 0, 0, 0);
                const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / 86_400_000);
                return {
                    name: c.name,
                    phone: c.phone || '',
                    city: c.city || '',
                    state: c.state || '',
                    clientName: c.name,
                    nextServiceDate: c.nextServiceDate!,
                    daysUntil,
                };
            })
            .sort((a, b) => new Date(a.nextServiceDate).getTime() - new Date(b.nextServiceDate).getTime());
    }, [clients, settings]);

    return { stats, alerts };
}
