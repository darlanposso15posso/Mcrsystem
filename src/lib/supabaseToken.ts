export let supabaseToken: string | null = null;

export const setSupabaseToken = (token: string | null) => {
    supabaseToken = token;
};
