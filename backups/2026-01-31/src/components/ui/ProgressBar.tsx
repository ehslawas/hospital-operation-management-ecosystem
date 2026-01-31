import { cn } from '@/lib/utils'

interface ProgressBarProps {
    progress: number
    className?: string
    indicatorClassName?: string
    label?: string
}

export function ProgressBar({ progress, className, indicatorClassName, label }: ProgressBarProps) {
    return (
        <div className={cn("w-full", className)}>
            {label && (
                <div className="flex justify-between text-xs mb-1 text-slate-500 font-medium">
                    <span>{label}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            )}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn("h-full bg-violet-500 transition-all duration-300 ease-out", indicatorClassName)}
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
            </div>
        </div>
    )
}
