import React, { useState } from "react";
import { useAuth } from "../lib/auth";

export default function Login(){
  const { login } = useAuth();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await login(username, password);
      // Sem reload forçado: o AuthProvider já atualiza o estado.
      window.location.href = "/"; // se preferir SPA puro, troque por: navigate("/");
    } catch (e:any) {
      setErr("Falha no login");
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
          {err && <div className="help" style={{ color: "red" }}>{err}</div>}
          <button className="btn primary" type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}
