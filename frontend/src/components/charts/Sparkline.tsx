import React from 'react';
export default function Sparkline({ data, width=360, height=140 }:{ data:number[]; width?:number; height?:number }){
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
  return (
    <svg width={width} height={height}>
      <rect x="0" y="0" width={width} height={height} fill="none" stroke="var(--border)" />
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2" />
    </svg>
  );
}
