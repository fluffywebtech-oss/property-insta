-- ============================================================================
-- Website Enquiries / Leads  (shared between the consumer site & admin panel)
-- ----------------------------------------------------------------------------
-- The public site's lead funnel (Contact Agent / Schedule Visit / Callback)
-- INSERTs here; the Admin Panel reads, updates the status, and deletes.
-- Run this once in the Supabase SQL editor to switch leads from localStorage
-- to a real cross-app table.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ref            text UNIQUE,                 -- human ref shown to the visitor, e.g. PI-AB12CD
  intent         text DEFAULT 'contact',      -- contact | visit | callback
  status         text DEFAULT 'New',          -- New | Contacted | Visit Booked | Closed
  property_id    bigint,
  property_title text,
  name           text,
  phone          text,
  email          text,
  message        text,
  visit_date     text,
  visit_time     text,
  agent_name     text,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx     ON public.leads (status);

-- Row-Level Security — permissive (anon read + write), matching the other tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_leads" ON public.leads;
CREATE POLICY "anon_all_leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
