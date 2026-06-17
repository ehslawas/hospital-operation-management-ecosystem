"use client";

import * as React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ className = "", onCheckedChange, onChange, ...props }: CheckboxProps){
  return (
    <input
      type="checkbox"
      className={`h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 ${className}`}
      onChange={(e) => {
        onChange?.(e);
        onCheckedChange?.(e.currentTarget.checked);
      }}
      {...props}
    />
  );
}

export default Checkbox;


