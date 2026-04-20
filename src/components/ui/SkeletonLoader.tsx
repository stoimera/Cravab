import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  className?: string
}

export function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 rounded-lg",
        className
      )}
    />
  )
}
