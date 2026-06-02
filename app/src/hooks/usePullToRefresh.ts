import { useEffect, useRef, useState, useCallback } from 'react'

interface Options {
  onRefresh: () => Promise<void> | void
  threshold?: number
  disabled?: boolean
}

export function usePullToRefresh({ onRefresh, threshold = 72, disabled = false }: Options) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const isPulling = useRef(false)

  const trigger = useCallback(async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
      setPullDistance(0)
    }
  }, [onRefresh])

  useEffect(() => {
    if (disabled) return

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        isPulling.current = true
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || startY.current === null || refreshing) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0) {
        // Clamp pull distance with rubber-band feel (sqrt gives natural resistance)
        setPullDistance(Math.min(threshold * 1.5, Math.sqrt(delta) * 6))
      }
    }

    const onTouchEnd = async () => {
      if (!isPulling.current) return
      isPulling.current = false
      if (pullDistance >= threshold && !refreshing) {
        await trigger()
      } else {
        setPullDistance(0)
      }
      startY.current = null
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [disabled, refreshing, pullDistance, threshold, trigger])

  const isTriggered = pullDistance >= threshold
  const progress = Math.min(1, pullDistance / threshold)

  return { refreshing, pullDistance, isTriggered, progress }
}
