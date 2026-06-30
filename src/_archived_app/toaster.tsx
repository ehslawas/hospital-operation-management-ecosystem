"use client";

import { Toaster as Sonner, toast as sonnerToast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      expand={true}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-slate-500",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-900 group-[.toast]:rounded-lg",
          success: 
            "group-[.toaster]:border-green-200 group-[.toaster]:bg-green-50",
          error:
            "group-[.toaster]:border-red-200 group-[.toaster]:bg-red-50",
          warning:
            "group-[.toaster]:border-amber-200 group-[.toaster]:bg-amber-50",
          info:
            "group-[.toaster]:border-blue-200 group-[.toaster]:bg-blue-50",
        },
      }}
      {...props}
    />
  );
}

// Enhanced toast wrapper functions
export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 4000,
    });
  },
  
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 5000,
    });
  },
  
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 4000,
    });
  },
  
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 4000,
    });
  },
  
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    });
  },
  
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },
  
  custom: (component: React.ReactNode) => {
    sonnerToast.custom(component);
  },
  
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

export default Toaster;

