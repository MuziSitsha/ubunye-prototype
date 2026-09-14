// Small client-side helper so every form/button follows spec §50: a human-readable
// message, never a raw error, and progress is never silently lost.

export class ApiError extends Error {}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(body.error ?? "We couldn't complete that step. Please try again.");
  }

  return body as T;
}
