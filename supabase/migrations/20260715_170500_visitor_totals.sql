-- Range totals: unique visitors must be DISTINCT across the whole range
-- (summing per-day uniques would count a returning visitor once per day).
CREATE OR REPLACE FUNCTION public.get_visit_totals(p_from date DEFAULT NULL)
RETURNS TABLE(unique_visitors bigint, total_visits bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
    SELECT count(DISTINCT sv.visitor_id)::bigint, COALESCE(sum(sv.hits), 0)::bigint
    FROM public.site_visits sv
    WHERE p_from IS NULL OR sv.day >= p_from;
END;
$$;

REVOKE ALL ON FUNCTION public.get_visit_totals(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_visit_totals(date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_visit_totals(date) TO authenticated;
