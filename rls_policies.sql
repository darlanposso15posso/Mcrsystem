-- ══════════════════════════════════════════════════════════════════
--  D&E Hood Cleaning — Row Level Security (RLS) Policies
--  Cole este SQL no SQL Editor do Supabase (Database > SQL Editor)
--  Execute uma vez por ambiente (staging e production separado)
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- HELPER FUNCTION — retorna o company_id do usuário autenticado
-- Criada no schema public (auth schema é protegido no Supabase)
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_company_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT company_id::text FROM profiles WHERE id = auth.uid() LIMIT 1),
    auth.uid()::text
  );
$$;


-- ══════════════════════════════════════════════════════════════════
--  TABLE: profiles
--  Cada usuário só vê/edita o próprio perfil
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para recriar limpo
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Nenhum usuário pode deletar o próprio perfil via API
-- (só via painel admin do Supabase)


-- ══════════════════════════════════════════════════════════════════
--  TABLE: clients
--  Isolamento total por company_id
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;

CREATE POLICY "clients_select"
  ON clients FOR SELECT
  USING (company_id::text = public.get_company_id());

CREATE POLICY "clients_insert"
  ON clients FOR INSERT
  WITH CHECK (company_id::text = public.get_company_id());

CREATE POLICY "clients_update"
  ON clients FOR UPDATE
  USING (company_id::text = public.get_company_id())
  WITH CHECK (company_id::text = public.get_company_id());

CREATE POLICY "clients_delete"
  ON clients FOR DELETE
  USING (company_id::text = public.get_company_id());


-- ══════════════════════════════════════════════════════════════════
--  TABLE: services  (histórico de limpezas / work orders)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_select" ON services;
DROP POLICY IF EXISTS "services_insert" ON services;
DROP POLICY IF EXISTS "services_update" ON services;
DROP POLICY IF EXISTS "services_delete" ON services;

CREATE POLICY "services_select"
  ON services FOR SELECT
  USING (company_id::text = public.get_company_id());

CREATE POLICY "services_insert"
  ON services FOR INSERT
  WITH CHECK (company_id::text = public.get_company_id());

CREATE POLICY "services_update"
  ON services FOR UPDATE
  USING (company_id::text = public.get_company_id())
  WITH CHECK (company_id::text = public.get_company_id());

CREATE POLICY "services_delete"
  ON services FOR DELETE
  USING (company_id::text = public.get_company_id());


-- ══════════════════════════════════════════════════════════════════
--  TABLE: leads  (CRM prospects)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select" ON leads;
DROP POLICY IF EXISTS "leads_insert" ON leads;
DROP POLICY IF EXISTS "leads_update" ON leads;
DROP POLICY IF EXISTS "leads_delete" ON leads;

CREATE POLICY "leads_select"
  ON leads FOR SELECT
  USING (company_id::text = public.get_company_id());

CREATE POLICY "leads_insert"
  ON leads FOR INSERT
  WITH CHECK (company_id::text = public.get_company_id());

CREATE POLICY "leads_update"
  ON leads FOR UPDATE
  USING (company_id::text = public.get_company_id())
  WITH CHECK (company_id::text = public.get_company_id());

CREATE POLICY "leads_delete"
  ON leads FOR DELETE
  USING (company_id::text = public.get_company_id());


-- ══════════════════════════════════════════════════════════════════
--  TABLE: notifications
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;

CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  USING (company_id::text = public.get_company_id());

CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  WITH CHECK (company_id::text = public.get_company_id());

CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  USING (company_id::text = public.get_company_id())
  WITH CHECK (company_id::text = public.get_company_id());

CREATE POLICY "notifications_delete"
  ON notifications FOR DELETE
  USING (company_id::text = public.get_company_id());


-- ══════════════════════════════════════════════════════════════════
--  TABLE: settings  (configurações da empresa / branding)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select" ON settings;
DROP POLICY IF EXISTS "settings_insert" ON settings;
DROP POLICY IF EXISTS "settings_update" ON settings;
DROP POLICY IF EXISTS "settings_delete" ON settings;

CREATE POLICY "settings_select"
  ON settings FOR SELECT
  USING (company_id::text = public.get_company_id());

CREATE POLICY "settings_insert"
  ON settings FOR INSERT
  WITH CHECK (company_id::text = public.get_company_id());

CREATE POLICY "settings_update"
  ON settings FOR UPDATE
  USING (company_id::text = public.get_company_id())
  WITH CHECK (company_id::text = public.get_company_id());

CREATE POLICY "settings_delete"
  ON settings FOR DELETE
  USING (company_id::text = public.get_company_id());


-- ══════════════════════════════════════════════════════════════════
--  VERIFICAÇÃO — rode após aplicar para confirmar
-- ══════════════════════════════════════════════════════════════════
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
