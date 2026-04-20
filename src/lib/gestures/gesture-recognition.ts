/**
 * Advanced Mobile Gesture Recognition
 * Handles complex touch gestures and interactions
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import { useMotionValue, useTransform, useSpring, PanInfo } from 'framer-motion'

export interface GestureConfig {
  threshold: number
  velocity: number
  direction: 'horizontal' | 'vertical' | 'both'
  enabled: boolean
}

export interface GestureState {
  isActive: boolean
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
  velocity: number
  progress: number
}

export interface SwipeGesture {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  velocity?: number
}

export interface PinchGesture {
  onPinchIn?: (scale: number) => void
  onPinchOut?: (scale: number) => void
  onPinchEnd?: (scale: number) => void
  threshold?: number
}

export interface LongPressGesture {
  onLongPress?: () => void
  duration?: number
  threshold?: number
}

export interface PullToRefreshGesture {
  onRefresh?: () => Promise<void>
  threshold?: number
  resistance?: number
}

// Swipe gesture hook
export function useSwipeGesture(config: SwipeGesture = {}) {
  const [gestureState, setGestureState] = useState<GestureState>({
    isActive: false,
    direction: null,
    distance: 0,
    velocity: 0,
    progress: 0
  })

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const velocityX = useMotionValue(0)
  const velocityY = useMotionValue(0)

  const threshold = config.threshold || 50
  const velocity = config.velocity || 500

  const handleDragStart = useCallback(() => {
    setGestureState(prev => ({ ...prev, isActive: true }))
  }, [])

  const handleDrag = useCallback((event: any, info: PanInfo) => {
    const { offset, velocity } = info
    
    velocityX.set(velocity.x)
    velocityY.set(velocity.y)
    
    const distance = Math.sqrt(offset.x ** 2 + offset.y ** 2)
    const direction = getDirection(offset.x, offset.y)
    const progress = Math.min(distance / threshold, 1)
    
    setGestureState({
      isActive: true,
      direction,
      distance,
      velocity: Math.sqrt(velocity.x ** 2 + velocity.y ** 2),
      progress
    })
  }, [threshold, velocityX, velocityY])

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const { offset, velocity } = info
    const distance = Math.sqrt(offset.x ** 2 + offset.y ** 2)
    const velocityMagnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
    const direction = getDirection(offset.x, offset.y)
    
    setGestureState(prev => ({ ...prev, isActive: false }))
    
    // Reset values
    x.set(0)
    y.set(0)
    velocityX.set(0)
    velocityY.set(0)
    
    // Check if gesture meets threshold
    if (distance > threshold || velocityMagnitude > (config.velocity || 0)) {
      switch (direction) {
        case 'left':
          config.onSwipeLeft?.()
          break
        case 'right':
          config.onSwipeRight?.()
          break
        case 'up':
          config.onSwipeUp?.()
          break
        case 'down':
          config.onSwipeDown?.()
          break
      }
    }
  }, [config, threshold, velocity, x, y, velocityX, velocityY])

  return {
    x,
    y,
    gestureState,
    dragHandlers: {
      onDragStart: handleDragStart,
      onDrag: handleDrag,
      onDragEnd: handleDragEnd
    }
  }
}

// Pinch gesture hook
export function usePinchGesture(config: PinchGesture = {}) {
  const [scale, setScale] = useState(1)
  const [isActive, setIsActive] = useState(false)
  
  const scaleValue = useMotionValue(1)
  const springScale = useSpring(scaleValue, { stiffness: 300, damping: 30 })

  const threshold = config.threshold || 0.1

  const handlePinchStart = useCallback(() => {
    setIsActive(true)
  }, [])

  const handlePinch = useCallback((event: any, info: any) => {
    const newScale = info.scale
    setScale(newScale)
    scaleValue.set(newScale)
    
    if (newScale < 1 - threshold) {
      config.onPinchIn?.(newScale)
    } else if (newScale > 1 + threshold) {
      config.onPinchOut?.(newScale)
    }
  }, [config, threshold, scaleValue])

  const handlePinchEnd = useCallback(() => {
    setIsActive(false)
    config.onPinchEnd?.(scale)
    scaleValue.set(1)
    setScale(1)
  }, [config, scale, scaleValue])

  return {
    scale: springScale,
    isActive,
    pinchHandlers: {
      onPinchStart: handlePinchStart,
      onPinch: handlePinch,
      onPinchEnd: handlePinchEnd
    }
  }
}

// Long press gesture hook
export function useLongPressGesture(config: LongPressGesture = {}) {
  const [isActive, setIsActive] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const startTimeRef = useRef<number>()

  const duration = config.duration || 500
  const threshold = config.threshold || 10

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0]
    startTimeRef.current = Date.now()
    
    timeoutRef.current = setTimeout(() => {
      setIsActive(true)
      config.onLongPress?.()
    }, duration)
  }, [config, duration])

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!startTimeRef.current) return
    
    const touch = event.touches[0]
    const startTouch = event.targetTouches[0]
    
    if (startTouch) {
      const distance = Math.sqrt(
        (touch.clientX - startTouch.clientX) ** 2 + 
        (touch.clientY - startTouch.clientY) ** 2
      )
      
      if (distance > threshold) {
        clearTimeout(timeoutRef.current)
        setIsActive(false)
      }
    }
  }, [threshold])

  const handleTouchEnd = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setIsActive(false)
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    isActive,
    longPressHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}

// Pull to refresh gesture hook
export function usePullToRefreshGesture(config: PullToRefreshGesture = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  
  const y = useMotionValue(0)
  const threshold = config.threshold || 80
  const resistance = config.resistance || 0.5

  const handleDrag = useCallback((event: any, info: PanInfo) => {
    const { offset } = info
    
    // Only allow downward pull when at top
    if (offset.y > 0) {
      const resistanceOffset = offset.y * resistance
      y.set(resistanceOffset)
      setPullDistance(resistanceOffset)
    }
  }, [y, resistance])

  const handleDragEnd = useCallback(async (event: any, info: PanInfo) => {
    const { offset } = info
    
    if (offset.y > threshold && !isRefreshing) {
      setIsRefreshing(true)
      y.set(threshold)
      
      try {
        await config.onRefresh?.()
      } finally {
        setIsRefreshing(false)
        y.set(0)
        setPullDistance(0)
      }
    } else {
      y.set(0)
      setPullDistance(0)
    }
  }, [config, threshold, isRefreshing, y])

  const progress = Math.min(pullDistance / threshold, 1)
  const canRefresh = pullDistance > threshold

  return {
    y,
    isRefreshing,
    progress,
    canRefresh,
    pullToRefreshHandlers: {
      onDrag: handleDrag,
      onDragEnd: handleDragEnd
    }
  }
}

// Multi-touch gesture hook
export function useMultiTouchGesture() {
  const [touches, setTouches] = useState<Touch[]>([])
  const [gesture, setGesture] = useState<{
    type: 'pinch' | 'rotate' | 'pan' | null
    scale: number
    rotation: number
    center: { x: number; y: number }
  }>({
    type: null,
    scale: 1,
    rotation: 0,
    center: { x: 0, y: 0 }
  })

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    setTouches(Array.from(event.touches) as any)
  }, [])

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    const newTouches = Array.from(event.touches) as any
    
    if (newTouches.length === 2 && touches.length === 2) {
      const [touch1, touch2] = newTouches
      const [prevTouch1, prevTouch2] = touches
      
      // Calculate distance and angle
      const distance = Math.sqrt(
        (touch2.clientX - touch1.clientX) ** 2 + 
        (touch2.clientY - touch1.clientY) ** 2
      )
      const prevDistance = Math.sqrt(
        (prevTouch2.clientX - prevTouch1.clientX) ** 2 + 
        (prevTouch2.clientY - prevTouch1.clientY) ** 2
      )
      
      const angle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      )
      const prevAngle = Math.atan2(
        prevTouch2.clientY - prevTouch1.clientY,
        prevTouch2.clientX - prevTouch1.clientX
      )
      
      const scale = distance / prevDistance
      const rotation = angle - prevAngle
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }
      
      setGesture({
        type: 'pinch',
        scale,
        rotation,
        center
      })
    }
    
    setTouches(newTouches)
  }, [touches])

  const handleTouchEnd = useCallback(() => {
    setTouches([])
    setGesture({
      type: null,
      scale: 1,
      rotation: 0,
      center: { x: 0, y: 0 }
    })
  }, [])

  return {
    touches,
    gesture,
    multiTouchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}

// Helper function to determine swipe direction
function getDirection(x: number, y: number): 'left' | 'right' | 'up' | 'down' | null {
  const absX = Math.abs(x)
  const absY = Math.abs(y)
  
  if (absX > absY) {
    return x > 0 ? 'right' : 'left'
  } else if (absY > absX) {
    return y > 0 ? 'down' : 'up'
  }
  
  return null
}

// Gesture combination hook
export function useGestureCombination(gestures: {
  swipe?: SwipeGesture
  pinch?: PinchGesture
  longPress?: LongPressGesture
  pullToRefresh?: PullToRefreshGesture
}) {
  const swipe = useSwipeGesture(gestures.swipe)
  const pinch = usePinchGesture(gestures.pinch)
  const longPress = useLongPressGesture(gestures.longPress)
  const pullToRefresh = usePullToRefreshGesture(gestures.pullToRefresh)
  const multiTouch = useMultiTouchGesture()

  return {
    swipe,
    pinch,
    longPress,
    pullToRefresh,
    multiTouch
  }
}
