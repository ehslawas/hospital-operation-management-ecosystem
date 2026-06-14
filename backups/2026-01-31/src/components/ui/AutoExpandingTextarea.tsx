"use client"

import * as React from "react"
import { useEffect, useRef } from "react"

export interface AutoExpandingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: boolean
    errorMessage?: string
    required?: boolean
    maxHeight?: string
}

export const AutoExpandingTextarea = React.forwardRef<HTMLTextAreaElement, AutoExpandingTextareaProps>(
    ({ className = "", label, error, errorMessage, required, maxHeight = "300px", ...props }, ref) => {
        const id = props.id || props.name
        const textareaRef = useRef<HTMLTextAreaElement | null>(null)

        // Merge refs
        React.useImperativeHandle(ref, () => textareaRef.current!)

        const adjustHeight = () => {
            const textarea = textareaRef.current
            if (textarea) {
                textarea.style.height = "auto"
                textarea.style.height = `${textarea.scrollHeight}px`
            }
        }

        useEffect(() => {
            adjustHeight()
        }, [props.value])

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

                <textarea
                    ref={textareaRef}
                    id={id}
                    onInput={() => adjustHeight()}
                    className={`
            w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 
            placeholder:text-slate-400 
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            resize-none overflow-hidden
            ${error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-400'
                        }
            ${className}
          `}
                    style={{ maxHeight, minHeight: '44px' }}
                    {...props}
                />

                {errorMessage && error && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errorMessage}
                    </p>
                )}
            </div>
        )
    }
)

AutoExpandingTextarea.displayName = "AutoExpandingTextarea"
