"use client";

import * as React from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

/**
 * Filter children to ensure only valid HTML elements are rendered inside the native <select>
 * This prevents "validateDOMNesting(...): <svg> cannot appear as a child of <select>" warnings.
 */
const getValidSelectChildren = (children: React.ReactNode): React.ReactNode[] => {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) return [];

    const type = child.type as any;
    const name = type.name || type.displayName || "";
    const props = child.props as Record<string, any>;

    // 1. If it's a native 'option' or 'optgroup', we keep it.
    if (type === "option" || type === "optgroup") return [child];

    // 2. If it is explicitly our SelectItem, we keep it.
    if (name === "SelectItem") return [child];

    // 3. Heuristic: If it has a 'value' prop, it's likely an option/item. We keep it.
    // This handles minified component names.
    // We explicitly exclude SelectValue which might have value prop in some implementations (though usually not).
    if ("value" in props && name !== "SelectValue" && name !== "SelectTrigger") {
      return [child];
    }

    // 4. If it has children, we RECURSE to find options inside it.
    // This automatically unwraps SelectContent, and safely ignores SelectTrigger (which returns no options).
    if (props.children) {
      return getValidSelectChildren(props.children);
    }

    return [];
  });
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, options, error, helperText, required, placeholder, children, onValueChange, ...props }, ref) => {
    const id = props.id || props.name;

    const selectClasses = `
      h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm text-slate-900 
      appearance-none
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
      ${error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
        : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-400'
      }
      ${className}
    `;

    const renderedChildren = options ? (
      options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))
    ) : getValidSelectChildren(children);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            className={selectClasses}
            onChange={(e) => {
              if (onValueChange) onValueChange(e.target.value);
              if (props.onChange) props.onChange(e);
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {renderedChildren}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}

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

// Helper to flatten children to text for <option>
// This ensures that <option> only receives text, even if a user passes formatted components.
const flattenChildren = (children: any): string => {
  return React.Children.toArray(children).reduce((text: string, child: any) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return text + child;
    }
    if (React.isValidElement(child) && child.props.children) {
      return text + flattenChildren(child.props.children);
    }
    return text;
  }, '');
};

// Compatibility stubs
export function SelectTrigger({ children }: any) { return <>{children}</>; }
export function SelectValue(_props: any) { return null; }
export function SelectContent({ children }: any) { return <>{children}</>; }

// SelectItem now safely renders children as text only, preventing nested tag errors
export function SelectItem({ children, value, className }: any) {
  const textContent = flattenChildren(children);
  return <option value={value} className={className}>{textContent}</option>;
}

SelectTrigger.displayName = "SelectTrigger";
SelectContent.displayName = "SelectContent";
SelectValue.displayName = "SelectValue";
SelectItem.displayName = "SelectItem";
