import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { CommunityApiError } from './api';

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Normalizes anything thrown into an Error (for hook `error` state). */
export function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason));
}

interface ActionToasts {
  /** Shown as the title of the error toast when the action fails. */
  errorTitle: string;
  /** Shown when the action succeeds; omit for actions that are self-evident. */
  success?: { title: string; message: string };
}

export type ActionResult<T> =
  { ok: true; value: T } | { ok: false; status?: number };

/**
 * Runs an API call and reports the outcome with the standard toasts, so
 * handlers don't each repeat try/catch and toast wiring. Callers handle their
 * own loading state and any follow-up (refreshing lists, closing dialogs) based
 * on the result. The failed result carries the API's HTTP status (when the
 * error came from the community API) so a caller can branch on specific
 * codes it cares about, e.g. a 409 conflict offering to reload.
 */
export async function runAction<T>(
  action: () => Promise<T>,
  { errorTitle, success }: ActionToasts,
): Promise<ActionResult<T>> {
  try {
    const value = await action();
    if (success) showSuccessToast(success);
    return { ok: true, value };
  } catch (error) {
    showErrorToast({ title: errorTitle, message: errorMessage(error) });
    return {
      ok: false,
      status: error instanceof CommunityApiError ? error.status : undefined,
    };
  }
}
