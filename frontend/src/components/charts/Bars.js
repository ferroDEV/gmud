import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Bars({ data, width = 360, height = 140 }) {
    const max = Math.max(...data) || 1;
    const pad = 10;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const bw = w / data.length - 10;
    return (_jsxs("svg", { width: width, height: height, children: [_jsx("rect", { x: "0", y: "0", width: width, height: height, fill: "none", stroke: "var(--border)" }), data.map((v, i) => {
                const barH = (v / max) * h;
                const x = pad + i * (bw + 10);
                const y = pad + (h - barH);
                return _jsx("rect", { x: x, y: y, width: bw, height: barH, fill: "var(--accent)" }, i);
            })] }));
}
