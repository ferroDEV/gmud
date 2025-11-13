import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Sparkline({ data, width = 360, height = 140 }) {
    const max = Math.max(...data) || 1;
    const min = Math.min(...data) || 0;
    const pad = 6;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w + pad;
        const y = (1 - (v - min) / (max - min || 1)) * h + pad;
        return `${x},${y}`;
    }).join(" ");
    return (_jsxs("svg", { width: width, height: height, children: [_jsx("rect", { x: "0", y: "0", width: width, height: height, fill: "none", stroke: "var(--border)" }), _jsx("polyline", { points: points, fill: "none", stroke: "var(--primary)", strokeWidth: "2" })] }));
}
