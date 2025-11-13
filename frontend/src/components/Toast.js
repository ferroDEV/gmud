import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
let pushFn = () => { };
export function toast(msg) { pushFn(msg); }
export default function ToastHost() {
    const [items, setItems] = useState([]);
    useEffect(() => {
        pushFn = (msg) => {
            setItems((prev) => [msg, ...prev].slice(0, 5));
            setTimeout(() => setItems((prev) => prev.slice(0, prev.length - 1)), 4000);
        };
    }, []);
    return _jsx("div", { className: "toast", children: items.map((m, i) => (_jsx("div", { className: "toast-item", children: m }, i))) });
}
