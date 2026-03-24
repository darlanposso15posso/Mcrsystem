import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Language } from '../translations';
import { Segment } from '../translations/segments';

export function useAppSettings(companyId?: string) {
    const [settings, setSettings] = useState<Record<string, string>>({});

    const fetchSettings = useCallback(async () => {
        if (!companyId) return;
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('company_id', companyId);
        
        if (!error && data) {
            const settingsData: Record<string, string> = {};
            data.forEach((row: any) => { settingsData[row.key] = row.value; });
            setSettings(settingsData);
        }
    }, [companyId]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Apply CSS custom properties — batched in one rAF to avoid style thrashing
    useEffect(() => {
        const handle = requestAnimationFrame(() => {
            const root = document.documentElement;
            const set = (prop: string, key: string) => {
                if (settings[key]) root.style.setProperty(prop, settings[key]);
            };
            if (settings['primary_color']) {
                root.style.setProperty('--primary-color', settings['primary_color']);
                root.style.setProperty('--primary-color-hover', settings['primary_color_hover'] || settings['primary_color'] + 'cc');
            }
            set('--bg-color',       'bg_color');
            set('--card-color',     'card_color');
            set('--card-alt-color', 'card_alt_color');
            set('--sidebar-bg',     'sidebar_bg');
            set('--sidebar-text',   'sidebar_text');
            set('--header-bg',      'header_bg');
            set('--text-primary',   'text_primary');
            set('--text-muted',     'text_muted');
            set('--border-color',   'border_color');
            set('--border-muted',   'border_muted');
            set('--font-family',    'font_family');
            set('--glow-intensity', 'glow_intensity');
        });
        return () => cancelAnimationFrame(handle);
    }, [settings]);

    const currentLanguage = (settings['language'] as Language) || 'pt';
    // Locked to Hood Cleaning for optimized testing per user request
    const currentSegment = 'hood_cleaning' as Segment;

    const upsertSetting = useCallback(async (key: string, value: string, companyId?: string) => {
        const payload: Record<string, string> = { key, value };
        if (companyId) payload['company_id'] = companyId;

        const { error } = await supabase
            .from('settings')
            .upsert(payload, { onConflict: companyId ? 'key,company_id' : 'key' });

        if (!error) {
            setSettings(prev => ({ ...prev, [key]: value }));
        }
        return { error };
    }, []);

    return {
        settings,
        setSettings,
        currentLanguage,
        currentSegment,
        upsertSetting,
    };
}
