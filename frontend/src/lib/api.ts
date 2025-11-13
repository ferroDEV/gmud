export type ApiError = { error: string; message?: string; code?: string; details?: any; status?: number };

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(()=> ({})) : await res.text();
  if (!res.ok) {
    const err: ApiError = typeof data === "object" ? { ...data, status: res.status } : { error: "http_error", message: String(data), status: res.status };
    throw err;
  }
  return data as T;
}

export const get = <T=any>(path: string) => api<T>(path);
export const post = <T=any>(path: string, body?: any) => api<T>(path, { method: "POST", body: JSON.stringify(body || {}) });
export const patch = <T=any>(path: string, body?: any) => api<T>(path, { method: "PATCH", body: JSON.stringify(body || {}) });
export const del = <T=any>(path: string) => api<T>(path, { method: "DELETE" });
