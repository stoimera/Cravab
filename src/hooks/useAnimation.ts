'use client'

import { useEffect, useState } from 'react'

// Hook for fade in animation
export function useFadeIn(delay: number = 0) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return isVisible
}

// Hook for slide up animation
export function useSlideUp(delay: number = 0) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return isVisible
}

// Hook for stagger animation
export function useStagger(items: any[], delay: number = 50) {
  const [visibleItems, setVisibleItems] = useState<number[]>([])

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    
    items.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleItems(prev => [...prev, index])
      }, index * delay)
      
      timers.push(timer)
    })

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [items, delay])

  return visibleItems
}

// Hook for intersection observer animation
export function useIntersectionAnimation(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold }
    )

    observer.observe(ref)

    return () => {
      observer.unobserve(ref)
    }
  }, [ref, threshold])

  return { ref: setRef, isVisible }
}
