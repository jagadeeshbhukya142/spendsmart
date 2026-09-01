const baseUrl = import.meta.env.VITE_API_URL || '/api';

export async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${baseUrl}${path}`, { credentials: 'include', headers: { ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}), ...options.headers }, ...options });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || 'Something went wrong.');
  return payload;
}

export const apiBaseUrl = baseUrl;

export function queryString(values) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') params.set(key, value); });
  const query = params.toString();
  return query ? `?${query}` : '';
}
