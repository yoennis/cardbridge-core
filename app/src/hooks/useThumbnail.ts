import { useState, useEffect } from 'react'

// In-memory cache survives re-renders but not page reload (thumbnails are cheap to regenerate)
const cache: Record<string, string> = {}

export function useThumbnail(videoUrl: string) {
  const [thumbnail, setThumbnail] = useState<string | null>(() => cache[videoUrl] ?? null)
  const [loading, setLoading] = useState(!cache[videoUrl])

  useEffect(() => {
    if (cache[videoUrl]) {
      setThumbnail(cache[videoUrl])
      setLoading(false)
      return
    }

    let cancelled = false
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 180

    video.preload = 'metadata'
    video.muted = true
    video.crossOrigin = 'anonymous'
    video.playsInline = true

    video.onloadeddata = () => {
      // Seek to 10% of duration or 2s, whichever is less
      video.currentTime = Math.min(2, (video.duration || 10) * 0.1)
    }

    video.onseeked = () => {
      if (cancelled) return
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0, 320, 180)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
      cache[videoUrl] = dataUrl
      setThumbnail(dataUrl)
      setLoading(false)
      video.src = ''
    }

    video.onerror = () => {
      if (!cancelled) setLoading(false)
    }

    video.src = videoUrl

    return () => {
      cancelled = true
      video.src = ''
    }
  }, [videoUrl])

  return { thumbnail, loading }
}
