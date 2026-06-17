import React, { useRef, useEffect, useImperativeHandle } from 'react';

export interface AutoExpandingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const AutoExpandingTextarea = React.forwardRef<HTMLTextAreaElement, AutoExpandingTextareaProps>(
  ({ className = "", ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    useImperativeHandle(ref, () => textareaRef.current!);

    const adjustHeight = () => {
      const element = textareaRef.current;
      if (element) {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
      }
    };

    useEffect(() => {
      adjustHeight();
    }, [props.value]);

    return (
      <textarea
        ref={textareaRef}
        rows={1}
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none overflow-hidden hover:border-slate-300 ${className}`}
        onInput={adjustHeight}
        {...props}
      />
    );
  }
);

AutoExpandingTextarea.displayName = "AutoExpandingTextarea";

export default AutoExpandingTextarea;
