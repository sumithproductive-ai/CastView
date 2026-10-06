import { useEffect, useState } from 'react';
import { authFetch } from '../../lib/apiAuth';

/**
 * Google expires refresh tokens ~weekly while this integration is in
 * Testing mode (see api/_gmailAuth.ts) — that's an expected, recurring
 * event, not an edge case, so the reconnect prompt needs to be checked
 * from anywhere in the app (Sidebar nav badge, Dashboard attention list),
 * not just inside the Settings page itself. Extracted here so both
 * consumers share one poll instead of duplicating the fetch.
 */
export function useGmailConnectionStatus(agencyId: string | null | undefined) {
  const [needsReauth, setNeedsReauth] = useState(false);

  useEffect(() => {
    if (!agencyId) return;
    let cancelled = false;

    const checkGmailStatus = async () => {
      try {
        const res = await authFetch('/api/gmail?action=status');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setNeedsReauth(data.status === 'needs_reauth');
      } catch {
        /* non-critical — Settings page surfaces the same state with more detail */
      }
    };

    checkGmailStatus();
    const interval = setInterval(checkGmailStatus, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [agencyId]);

  return { needsReauth };
}
