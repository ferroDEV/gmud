import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

export default function Login(){
  const { login, error } = useAuth();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try{
      await login(username, password);
      window.location.href = "/";
    }catch(e:any){
      const ae = e as ApiError;
      setErr(ae?.message || ae?.error || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div className="card" style={{ width: 420, maxWidth: "94vw" }}>
        <div className="card-h"><strong>Entrar</strong><div className="help">AD ou admin local</div></div>
        <form className="card-b grid" onSubmit={submit}>
          <div>
            <label>Usuário</label>
            <input className="input" value={username} onChange={e=>setU(e.target.value)} placeholder="usuario ou admin@local"/>
          </div>
          <div>
            <label>Senha</label>
            <input className="input" type="password" value={password} onChange={e=>setP(e.target.value)} />
          </div>
          {(err || error) && <div className="alert">{err || error}</div>}
          <button className="btn primary" type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        </form>
      </div>
    </div>
  );
}
