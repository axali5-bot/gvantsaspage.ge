-- Visitor counter: anonymous visitor_id (random uuid living in the browser's
-- localStorage) + day. No IP, no personal data. Reads are admin-only; writes
-- happen only through the record_visit RPC.

CREATE TABLE IF NOT EXISTS public.site_visits (
  visitor_id uuid NOT NULL,
  day date NOT NULL DEFAULT current_date,
  hits int NOT NULL DEFAULT 1,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_id, day)
);

CREATE INDEX IF NOT EXISTS idx_site_visits_day ON public.site_visits(day);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.site_visits FROM anon;
GRANT SELECT ON public.site_visits TO authenticated;

DROP POLICY IF EXISTS site_visits_admin_read ON public.site_visits;
CREATE POLICY site_visits_admin_read ON public.site_visits
  FOR SELECT TO authenticated
  USING (is_admin());

-- One row per visitor per day; repeat calls only bump hits (capped, so a
-- misbehaving client can't inflate a counter unboundedly — and unique-visitor
-- counts are immune to spam by construction).
CREATE OR REPLACE FUNCTION public.record_visit(p_visitor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF p_visitor_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.site_visits (visitor_id, day)
  VALUES (p_visitor_id, current_date)
  ON CONFLICT (visitor_id, day)
  DO UPDATE SET hits = LEAST(site_visits.hits + 1, 1000), last_seen = now();
END;
$$;

REVOKE ALL ON FUNCTION public.record_visit(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_visit(uuid) TO anon, authenticated;

-- Per-day aggregates for the admin dashboard (avoids PostgREST row limits).
CREATE OR REPLACE FUNCTION public.get_visit_stats(p_from date DEFAULT NULL)
RETURNS TABLE(day date, visitors bigint, visits bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
    SELECT sv.day, count(*)::bigint, COALESCE(sum(sv.hits), 0)::bigint
    FROM public.site_visits sv
    WHERE p_from IS NULL OR sv.day >= p_from
    GROUP BY sv.day
    ORDER BY sv.day;
END;
$$;

REVOKE ALL ON FUNCTION public.get_visit_stats(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_visit_stats(date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_visit_stats(date) TO authenticated;
