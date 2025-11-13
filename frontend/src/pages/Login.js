import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "../lib/auth";
export default function Login() {
    const { login, error } = useAuth();
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            await login(username, password);
            window.location.href = "/";
        }
        catch (e) {
            const ae = e;
            setErr(ae?.message || ae?.error || "Falha no login");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { style: { minHeight: "100vh", display: "grid", placeItems: "center" }, children: _jsxs("div", { className: "card", style: { width: 420, maxWidth: "94vw" }, children: [_jsxs("div", { className: "card-h", children: [_jsx("strong", { children: "Entrar" }), _jsx("div", { className: "help", children: "AD ou admin local" })] }), _jsxs("form", { className: "card-b grid", onSubmit: submit, children: [_jsxs("div", { children: [_jsx("label", { children: "Usu\u00E1rio" }), _jsx("input", { className: "input", value: username, onChange: e => setU(e.target.value), placeholder: "usuario ou admin@local" })] }), _jsxs("div", { children: [_jsx("label", { children: "Senha" }), _jsx("input", { className: "input", type: "password", value: password, onChange: e => setP(e.target.value) })] }), (err || error) && _jsx("div", { className: "alert", children: err || error }), _jsx("button", { className: "btn primary", type: "submit", disabled: loading, children: loading ? "Entrando..." : "Entrar" })] })] }) }));
}
