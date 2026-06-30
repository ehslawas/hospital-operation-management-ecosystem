"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
  label?: string;
  error?: boolean | string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ value, onValueChange, onChange, children, className = "", label, error, placeholder, options, helperText, ...props }, ref) => {
    // Detect if we are using the custom pattern (SelectTrigger, SelectContent, etc.)
    const childrenArray = React.Children.toArray(children);
    const hasCustomComponents = childrenArray.some(
      (child: any) => 
        child.type === SelectTrigger || 
        child.type === SelectContent || 
        child.type === SelectItem
    );

    if (hasCustomComponents) {
      return (
        <div data-select className={cn("w-full", className)}>
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;
            
            // Only clone and pass props to custom components, not raw HTML elements like <option>
            if (typeof child.type === 'string') return child;
            
            return React.cloneElement(child, { 
              selectValue: value, 
              onChange: (v: any) => {
                // If it's a string from SelectItem, call onValueChange
                if (typeof v === 'string') {
                  onValueChange?.(v);
                  // We can't easily trigger a native onChange with just a string value here
                } else {
                  onChange?.(v);
                  onValueChange?.(v.target.value);
                }
              }
            } as any);
          })}
        </div>
      );
    }

    // Default to styled native select
    const selectClasses = cn(
      "min-h-[2.75rem] w-full rounded-xl border bg-white px-4 py-2 text-sm text-slate-900 leading-normal transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-offset-1",
      "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
      error 
        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
        : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-400",
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          value={value}
          onChange={(e) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          className={selectClasses}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export function SelectTrigger({ children, className = "" }: any) {
  return (
    <button 
      type="button" 
      className={cn(
        "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-left text-sm flex items-center justify-between",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: any) { 
  return <span className="text-slate-600">{placeholder}</span>; 
}

export function SelectContent({ children }: any) { 
  return <div className="mt-2 grid gap-1">{children}</div>; 
}

export function SelectItem({ value, children, selectValue, onChange }: any) {
  const active = selectValue === value;
  return (
    <button 
      type="button" 
      onClick={() => onChange && onChange(value)} 
      className={cn(
        "w-full text-left px-3 py-2 rounded-lg border transition-colors",
        active 
          ? "bg-blue-50 border-blue-200 text-blue-700 font-medium" 
          : "border-slate-200 hover:bg-slate-50 text-slate-700"
      )}
    >
      {children}
    </button>
  );
}
