import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
export default class ErrorBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { console.error("UI ErrorBoundary:", error, info); }
    render() {
        if (this.state.hasError) {
            return _jsxs("div", { className: "container", style: { paddingTop: 16 }, children: [_jsxs("div", { className: "alert", children: [_jsx("b", { children: "Ocorreu um erro na interface." }), _jsx("br", {}), String(this.state.error?.message || this.state.error)] }), _jsx("div", { style: { marginTop: 8 }, children: _jsx("button", { className: "btn", onClick: () => window.location.reload(), children: "Recarregar" }) })] });
        }
        return this.props.children;
    }
}
