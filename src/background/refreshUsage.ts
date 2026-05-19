import { fetchUsage } from '../providers/claudeWebApiProvider';
import {
  getOrgId,
  getUsageState,
  setUsageState,
  getSettings,
  getNotificationMemory,
  setNotificationMemory,
  getSnoozeState,
} from '../core/storage';
import { updateBadge, setBadgeSetup, setBadgeError } from './badge';
import { evaluateNotifications, notifySyncFailed } from './notifications';
import { ProviderError } from '../shared/errors';
import type { ClaudeUsageState } from '../core/usageModel';

export async function refreshUsage(): Promise<void> {
  const orgId = await getOrgId();
  if (!orgId) {
    await setBadgeSetup();
    return;
  }

  const [prevUsage, settings, notifMemory, snooze] = await Promise.all([
    getUsageState(),
    getSettings(),
    getNotificationMemory(),
    getSnoozeState(),
  ]);

  let newUsage: ClaudeUsageState;
  try {
    newUsage = await fetchUsage(orgId);
  } catch (err) {
    if (err instanceof ProviderError) {
      const errState: ClaudeUsageState = {
        fiveHour: prevUsage?.fiveHour ?? { utilization: null, resetsAt: null },
        sevenDay: prevUsage?.sevenDay ?? { utilization: null, resetsAt: null },
        extraUsage: prevUsage?.extraUsage ?? {
          enabled: false,
          utilization: null,
          monthlyLimit: null,
          usedCredits: null,
          currency: null,
        },
        source: 'web-api',
        lastSyncedAt: prevUsage?.lastSyncedAt ?? new Date().toISOString(),
        lastError: err.message,
        lastStatusCode: err.code === 'AUTH_FAILED' ? 401 : undefined,
      };
      await setUsageState(errState);
      if (err.code === 'AUTH_FAILED' || err.code === 'NETWORK_ERROR') {
        notifySyncFailed(settings);
      }
      const hasData = prevUsage?.fiveHour.utilization !== null || prevUsage?.sevenDay.utilization !== null;
      if (prevUsage && hasData) {
        await updateBadge(prevUsage);
      } else {
        await setBadgeError();
      }
    }
    return;
  }

  await setUsageState(newUsage);
  await updateBadge(newUsage);

  const updatedMemory = evaluateNotifications(newUsage, prevUsage, notifMemory, settings, snooze);
  await setNotificationMemory(updatedMemory);
}
