"use client";

import * as React from "react";

export function Select({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) {
  return <div data-select>{React.Children.map(children as any, (c:any)=> React.isValidElement(c) ? React.cloneElement(c, { selectValue:value, onChange:onValueChange }) : c)}</div>;
}

export function SelectTrigger({ children, className = "" }: any) {
  return <button type="button" className={`h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-left text-sm flex items-center justify-between ${className}`}>{children}</button>;
}

export function SelectValue({ placeholder }: any) { return <span className="text-slate-600">{placeholder}</span>; }

export function SelectContent({ children }: any) { return <div className="mt-2 grid gap-1">{children}</div>; }

export function SelectItem({ value, children, selectValue, onChange }: any) {
  const active = selectValue === value;
  return (
    <button type="button" onClick={() => onChange && onChange(value)} className={`w-full text-left px-3 py-2 rounded-lg border ${active ? "bg-blue-50 border-blue-200 text-blue-700" : "border-slate-200 hover:bg-slate-50"}`}>
      {children}
    </button>
  );
}




