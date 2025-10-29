export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const get = <T=any>(path: string) => api<T>(path);
export const post = <T=any>(path: string, body?: any) => api<T>(path, { method: "POST", body: JSON.stringify(body || {}) });
export const patch = <T=any>(path: string, body?: any) => api<T>(path, { method: "PATCH", body: JSON.stringify(body || {}) });
export const del = <T=any>(path: string) => api<T>(path, { method: "DELETE" });
