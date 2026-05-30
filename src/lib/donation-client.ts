type SyncResult = { success: boolean; data?: unknown; error?: string };

type SyncApiResponse = {
  success?: boolean;
  data?: unknown;
  error?: {
    message?: string;
  };
  message?: string;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
};

export async function syncDonationPayment(
  orderId: string,
  signal?: AbortSignal,
): Promise<SyncResult> {
  if (!orderId) {
    return { success: false, error: 'orderId is required' };
  }

  try {
    const res = await fetch('/api/webhook/midtrans/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
      // include cookies/session for same-origin auth
      credentials: 'include',
      signal,
    });

    const json = (await res.json().catch(() => ({}))) as SyncApiResponse;

    if (res.ok && json?.success) {
      return { success: true, data: json.data };
    }

    const errMsg =
      json?.error?.message || json?.message || res.statusText || 'Sync failed';
    return { success: false, error: errMsg };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'aborted' };
    }
    console.error('syncDonationPayment error:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}
