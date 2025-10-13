"use client";

import * as React from "react";

export function Tabs({ value, onValueChange, className = "", children }:{ value:string; onValueChange:(v:string)=>void; className?:string; children: React.ReactNode; }){
  return <div className={className}>{React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child as any, { tabsValue: value, setTabsValue: onValueChange });
  })}</div>;
}

export function TabsList({ className = "", children, tabsValue, setTabsValue }: any){
  return <div className={`flex gap-2 ${className}`}>{React.Children.map(children, (child:any)=> React.cloneElement(child, { tabsValue, setTabsValue }))}</div>;
}

export function TabsTrigger({ value, children, className = "", tabsValue, setTabsValue }: any){
  const active = tabsValue === value;
  return (
    <button onClick={()=>setTabsValue(value)} className={`px-4 py-2 rounded-xl text-sm font-semibold border ${active?"bg-blue-50 text-blue-700 border-blue-200":"border-slate-200 text-slate-600 hover:bg-slate-50"} ${className}`}>{children}</button>
  );
}

export function TabsContent({ value, children, className = "", tabsValue }: any){
  if (tabsValue !== value) return null;
  return <div className={className}>{children}</div>;
}





