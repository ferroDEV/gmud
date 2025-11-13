import React, { useEffect, useState } from "react";

let pushFn: (msg: string) => void = () => {};
export function toast(msg: string) { pushFn(msg); }

export default function ToastHost(){
  const [items, setItems] = useState<string[]>([]);
  useEffect(()=>{
    pushFn = (msg: string) => {
      setItems((prev)=>[msg, ...prev].slice(0,5));
      setTimeout(()=> setItems((prev)=> prev.slice(0, prev.length-1)), 4000);
    };
  },[]);
  return <div className="toast">
    {items.map((m,i)=>(<div key={i} className="toast-item">{m}</div>))}
  </div>;
}
