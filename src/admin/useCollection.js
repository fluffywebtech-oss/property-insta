import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Supabase-backed collection with graceful localStorage fallback.
 * Mirrors the admin panel's hook so the in-frontend admin shares the same tables.
 */
export function useCollection(table, seed = [], opts = {}) {
  const { localKey = `os_${table}`, orderBy = 'id', ascending = true } = opts;
  const [rows, setRows] = useState(seed);
  const [loading, setLoading] = useState(true);
  const dbReady = useRef(false);

  const loadLocal = useCallback(() => {
    try { const s = localStorage.getItem(localKey); if (s) return JSON.parse(s); } catch { /* ignore */ }
    return seed;
  }, [localKey, seed]);

  const saveLocal = useCallback((next) => {
    try { localStorage.setItem(localKey, JSON.stringify(next)); } catch { /* ignore */ }
  }, [localKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending });
          if (!cancelled && !error && Array.isArray(data)) {
            dbReady.current = true;
            setRows(data.length ? data : loadLocal());
            setLoading(false);
            return;
          }
        } catch { /* fall through to local */ }
      }
      if (!cancelled) { setRows(loadLocal()); setLoading(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const add = useCallback(async (row) => {
    if (dbReady.current && supabase) {
      const { data, error } = await supabase.from(table).insert(row).select().single();
      if (!error && data) { setRows(prev => [data, ...prev]); return data; }
    }
    const local = { id: Date.now(), ...row };
    setRows(prev => { const next = [local, ...prev]; saveLocal(next); return next; });
    return local;
  }, [table, saveLocal]);

  const update = useCallback(async (id, patch) => {
    if (dbReady.current && supabase) {
      const { error } = await supabase.from(table).update(patch).eq('id', id);
      if (!error) { setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r)); return; }
    }
    setRows(prev => { const next = prev.map(r => r.id === id ? { ...r, ...patch } : r); saveLocal(next); return next; });
  }, [table, saveLocal]);

  const remove = useCallback(async (id) => {
    if (dbReady.current && supabase) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) { setRows(prev => prev.filter(r => r.id !== id)); return; }
    }
    setRows(prev => { const next = prev.filter(r => r.id !== id); saveLocal(next); return next; });
  }, [table, saveLocal]);

  return { rows, setRows, loading, add, update, remove };
}
