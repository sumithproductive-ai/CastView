import { checkRateLimit } from './_rateLimit';

/**
 * Shared Claude-cost budget across evaluate/brief-match/pathway — an agency
 * shouldn't be able to dodge one endpoint's cap by hammering another.
 * Numbers are deliberately generous starting points; tune once real usage
 * data comes in.
 */
const HOURLY_MAX_BY_PLAN: Record<string, number> = {
  trial: 10,
  solo: 30,
  studio: 60,
  agency: 120,
};

const DAILY_MAX_BY_PLAN: Record<string, number> = {
  trial: 15,
  solo: 100,
  studio: 250,
  agency: 500,
};

export type AiQuotaResult =
  | { allowed: true }
  | { allowed: false; reason: 'hourly_limit' | 'daily_limit' };

export async function checkAiQuota(agencyId: string, plan: string): Promise<AiQuotaResult> {
  const planKey = (plan || 'trial').toLowerCase();
  const hourlyMax = HOURLY_MAX_BY_PLAN[planKey] ?? HOURLY_MAX_BY_PLAN.trial;
  const dailyMax = DAILY_MAX_BY_PLAN[planKey] ?? DAILY_MAX_BY_PLAN.trial;

  const hourly = await checkRateLimit(`ai-hourly:${agencyId}`, 3600, hourlyMax);
  if (!hourly.allowed) return { allowed: false, reason: 'hourly_limit' };

  const daily = await checkRateLimit(`ai-daily:${agencyId}`, 86_400, dailyMax);
  if (!daily.allowed) return { allowed: false, reason: 'daily_limit' };

  return { allowed: true };
}
