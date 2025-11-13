export async function api(path, init) {
    const res = await fetch(path, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        ...init,
    });
    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const data = isJson ? await res.json().catch(() => ({})) : await res.text();
    if (!res.ok) {
        const err = typeof data === "object" ? { ...data, status: res.status } : { error: "http_error", message: String(data), status: res.status };
        throw err;
    }
    return data;
}
export const get = (path) => api(path);
export const post = (path, body) => api(path, { method: "POST", body: JSON.stringify(body || {}) });
export const patch = (path, body) => api(path, { method: "PATCH", body: JSON.stringify(body || {}) });
export const del = (path) => api(path, { method: "DELETE" });

const BASE =
  import.meta.env.VITE_API_URL || "http://localhost:4000"; // backend padrão