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

    // Apply CSS custom properties whenever settings change
    useEffect(() => {
        const root = document.documentElement;
        if (settings['primary_color']) {
            root.style.setProperty('--primary-color', settings['primary_color']);
            // Generate a slightly darker hover color automatically if not provided
            root.style.setProperty('--primary-color-hover', settings['primary_color_hover'] || settings['primary_color'] + 'cc');
        }
        if (settings['bg_color']) root.style.setProperty('--bg-color', settings['bg_color']);
        if (settings['card_color']) root.style.setProperty('--card-color', settings['card_color']);
        if (settings['card_alt_color']) root.style.setProperty('--card-alt-color', settings['card_alt_color']);
        if (settings['sidebar_bg']) root.style.setProperty('--sidebar-bg', settings['sidebar_bg']);
        if (settings['sidebar_text']) root.style.setProperty('--sidebar-text', settings['sidebar_text']);
        if (settings['header_bg']) root.style.setProperty('--header-bg', settings['header_bg']);
        if (settings['text_primary']) root.style.setProperty('--text-primary', settings['text_primary']);
        if (settings['text_muted']) root.style.setProperty('--text-muted', settings['text_muted']);
        if (settings['border_color']) root.style.setProperty('--border-color', settings['border_color']);
        if (settings['border_muted']) root.style.setProperty('--border-muted', settings['border_muted']);
        if (settings['font_family']) root.style.setProperty('--font-family', settings['font_family']);
        if (settings['glow_intensity']) root.style.setProperty('--glow-intensity', settings['glow_intensity']);
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
