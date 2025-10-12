"use client";

import * as React from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Dialog({ open, onOpenChange, children, size = 'md' }: DialogProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);
  
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      // Trigger animation
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      document.body.style.overflow = 'unset';
      setIsAnimating(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw] max-h-[90vh]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop with fade-in animation */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog Content with scale and fade animation */}
      <div 
        className={`relative z-50 w-full ${sizeClasses[size]} transition-all duration-300 ${
          isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogTrigger({ asChild, children }: any) {
  return <>{children}</>;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

export function DialogContent({ className = "", children }: DialogContentProps) {
  return (
    <div className={`relative bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 pt-6 pb-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30 ${className}`}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-xl font-bold text-slate-900 pr-8 ${className}`}>{children}</h3>;
}

export function DialogDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-slate-600 mt-1.5 ${className}`}>{children}</p>;
}

export function DialogBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-5 overflow-y-auto ${className}`}>{children}</div>;
}

export function DialogFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 flex justify-end gap-2 border-t border-slate-200 bg-slate-50/50 ${className}`}>
      {children}
    </div>
  );
}

interface DialogCloseProps {
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function DialogClose({ className = "", onClick, children }: DialogCloseProps) {
  return (
    <button
      onClick={onClick}
      className={`absolute right-4 top-4 rounded-full p-2 hover:bg-slate-100 transition-all duration-200 hover:scale-110 active:scale-95 z-10 ${className}`}
      aria-label="Close dialog"
    >
      {children || <X className="h-5 w-5 text-slate-500" />}
    </button>
  );
}

// Alert Dialog variant for confirmations
export function AlertDialog({ open, onOpenChange, children }: DialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange} size="sm">{children}</Dialog>;
}

export function AlertDialogContent({ className = "", children }: DialogContentProps) {
  return (
    <div className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in ${className}`}>
      {children}
    </div>
  );
}

export function AlertDialogHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 pt-6 pb-4 ${className}`}>
      {children}
    </div>
  );
}

export function AlertDialogTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-bold text-slate-900 flex items-center gap-2 ${className}`}>{children}</h3>;
}

export function AlertDialogDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-slate-600 mt-2 ${className}`}>{children}</p>;
}

export function AlertDialogFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 flex justify-end gap-2 bg-slate-50 ${className}`}>
      {children}
    </div>
  );
}
