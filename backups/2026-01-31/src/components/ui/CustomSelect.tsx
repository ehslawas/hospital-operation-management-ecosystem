"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomSelectOption {
    value: string;
    label: string;
    subLabel?: string;
    description?: string;
}

export interface CustomSelectProps {
    label?: string;
    options: CustomSelectOption[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    error?: string;
    required?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    label,
    options,
    value,
    onValueChange,
    placeholder = "Select option...",
    disabled = false,
    className,
    error,
    required
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpwards, setOpenUpwards] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find((opt) => opt.value === value);

    // Toggle and detect position
    const toggleDropdown = () => {
        if (disabled) return;

        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // If less than 320px (max-height of dropdown + margin), open upwards
            setOpenUpwards(spaceBelow < 320);
        }
        setIsOpen(!isOpen);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onValueChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={cn("w-full space-y-2", className)} ref={containerRef}>
            {label && (
                <label className="block text-sm font-semibold text-slate-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={toggleDropdown}
                    disabled={disabled}
                    className={cn(
                        "w-full h-auto min-h-[44px] px-4 py-2.5 flex items-center justify-between text-left transition-all duration-200 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm",
                        isOpen ? "border-violet-500 ring-2 ring-violet-500/10" : "border-slate-300 hover:border-slate-400",
                        disabled ? "bg-slate-50 cursor-not-allowed opacity-60" : "cursor-pointer",
                        error ? "border-red-300 ring-red-50" : ""
                    )}
                >
                    <div className="flex-1 overflow-hidden pr-2">
                        {selectedOption ? (
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-slate-900 truncate uppercase tracking-tight">
                                    {selectedOption.label}
                                </span>
                                {selectedOption.subLabel && (
                                    <span className="text-xs text-slate-500 truncate leading-tight">
                                        {selectedOption.subLabel}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span className="text-slate-400">{placeholder}</span>
                        )}
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                    <div
                        className={cn(
                            "absolute left-0 right-0 z-[100] bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto ring-1 ring-black/5",
                            openUpwards ? "bottom-full mb-2" : "top-full mt-2"
                        )}
                    >
                        <div className="py-1">
                            {options.length === 0 ? (
                                <div className="px-4 py-8 text-center text-slate-400 text-sm italic">
                                    No options available
                                </div>
                            ) : (
                                options.map((option) => {
                                    const isSelected = option.value === value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleSelect(option.value)}
                                            className={cn(
                                                "w-full px-4 py-3 flex items-start gap-3 text-left transition-colors duration-150 group",
                                                isSelected ? "bg-violet-50" : "hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col gap-1">
                                                    <span className={cn(
                                                        "text-sm font-bold uppercase tracking-tight",
                                                        isSelected ? "text-violet-700" : "text-slate-900"
                                                    )}>
                                                        {option.label}
                                                    </span>
                                                    <span className={cn(
                                                        "text-xs leading-normal",
                                                        isSelected ? "text-violet-600/80" : "text-slate-500"
                                                    )}>
                                                        {option.subLabel}
                                                    </span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};
