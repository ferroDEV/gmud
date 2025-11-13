import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Donut({ data, size = 140 }) {
    const total = data.reduce((a, b) => a + b.value, 0) || 1;
    let start = 0;
    const r = size / 2, cx = r, cy = r, strokeW = 18;
    return (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [_jsxs("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, children: [_jsx("circle", { cx: cx, cy: cy, r: r - strokeW / 2, fill: "none", stroke: "var(--border)", strokeWidth: strokeW }), data.map((s, i) => {
                        const frac = s.value / total;
                        const dash = Math.PI * (r - strokeW / 2) * 2;
                        const dashVal = frac * dash;
                        const gapVal = dash - dashVal;
                        const rot = (start / total) * 360 - 90;
                        start += s.value;
                        return _jsx("circle", { cx: cx, cy: cy, r: r - strokeW / 2, fill: "none", stroke: s.color, strokeWidth: strokeW, strokeDasharray: `${dashVal} ${gapVal}`, transform: `rotate(${rot} ${cx} ${cy})` }, i);
                    })] }), _jsx("div", { children: data.map((s, i) => _jsxs("div", { className: "help", style: { display: "flex", alignItems: "center", gap: 6 }, children: [_jsx("span", { style: { width: 10, height: 10, background: s.color, display: "inline-block", borderRadius: 2 } }), s.label, " (", s.value, ")"] }, i)) })] }));
}
