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
            // Security: validate color values before setting CSS properties (CSS injection prevention)
            const safeColor = (v: string) => /^(#[0-9A-Fa-f]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+[\s,.\d]*\))$/.test(v.trim());
            const safeFloat = (v: string) => /^[0-9]*\.?[0-9]+$/.test(v.trim());
            const safeFont  = (v: string) => v.length < 120 && /^[\w\s"',\-]+$/.test(v);

            const setColor = (prop: string, key: string) => {
                const v = settings[key];
                if (v && safeColor(v)) root.style.setProperty(prop, v);
            };
            if (settings['primary_color'] && safeColor(settings['primary_color'])) {
                root.style.setProperty('--primary-color', settings['primary_color']);
                const hover = settings['primary_color_hover'];
                root.style.setProperty('--primary-color-hover', (hover && safeColor(hover)) ? hover : settings['primary_color'] + 'cc');
            }
            setColor('--bg-color',       'bg_color');
            setColor('--card-color',     'card_color');
            setColor('--card-alt-color', 'card_alt_color');
            setColor('--sidebar-bg',     'sidebar_bg');
            setColor('--sidebar-text',   'sidebar_text');
            setColor('--header-bg',      'header_bg');
            setColor('--text-primary',   'text_primary');
            setColor('--text-muted',     'text_muted');
            setColor('--border-color',   'border_color');
            setColor('--border-muted',   'border_muted');
            if (settings['font_family'] && safeFont(settings['font_family'])) {
                root.style.setProperty('--font-family', settings['font_family']);
            }
            if (settings['glow_intensity'] && safeFloat(settings['glow_intensity'])) {
                root.style.setProperty('--glow-intensity', settings['glow_intensity']);
            }
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
