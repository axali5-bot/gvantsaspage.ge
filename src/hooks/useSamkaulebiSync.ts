import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface SyncRecord {
  samkaulebi_id: string;
  status: 'synced' | 'dirty' | 'error';
  last_synced_at: string;
  last_error: string | null;
}

export type SyncMap = Map<string, SyncRecord>;

export const SYNC_KEY = ['samkaulebi_sync'] as const;

export function useSamkaulebiSync() {
  return useQuery<SyncMap>({
    queryKey: SYNC_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('samkaulebi_sync')
        .select('avon_product_id, samkaulebi_id, status, last_synced_at, last_error');
      if (error) throw error;
      const map = new Map<string, SyncRecord>();
      for (const row of data ?? []) {
        map.set(row.avon_product_id, {
          samkaulebi_id: row.samkaulebi_id,
          status: row.status as SyncRecord['status'],
          last_synced_at: row.last_synced_at,
          last_error: row.last_error,
        });
      }
      return map;
    },
    staleTime: 30_000,
  });
}

export function useInvalidateSyncMap() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: SYNC_KEY });
}
