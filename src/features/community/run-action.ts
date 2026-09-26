import { showErrorToast, showSuccessToast } from '@/utils/toast';

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

interface ActionToasts {
  /** Shown as the title of the error toast when the action fails. */
  errorTitle: string;
  /** Shown when the action succeeds; omit for actions that are self-evident. */
  success?: { title: string; message: string };
}

export type ActionResult<T> = { ok: true; value: T } | { ok: false };

/**
 * Runs an API call and reports the outcome with the standard toasts, so
 * handlers don't each repeat try/catch and toast wiring. Callers handle their
 * own loading state and any follow-up (refreshing lists, closing dialogs) based
 * on the result.
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
    return { ok: false };
  }
}
