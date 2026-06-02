import { useRef, useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft, Download, Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, RotateCcw, RotateCw,
} from 'lucide-react'
import { streamUrl } from '../api/client'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

export default function PlayerPage() {
  const { deviceId, clipId } = useParams<{ deviceId: string; clipId: string }>()
  const url = streamUrl(deviceId!, clipId!)
  const fileName = clipId?.split('_').slice(1).join('_') ?? clipId ?? 'clip'

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const seekRef = useRef<HTMLDivElement>(null)
  const seekFillRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const progress = duration ? (currentTime / duration) * 100 : 0

  useEffect(() => {
    if (seekFillRef.current) seekFillRef.current.style.width = `${progress}%`
  }, [progress])

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  const revealControls = useCallback(() => {
    setShowControls(true)
    if (playing) scheduleHide()
  }, [playing, scheduleHide])

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current
      if (!v || (e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === ' ') { e.preventDefault(); playing ? v.pause() : v.play() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 10) }
      if (e.key === 'ArrowRight') { e.preventDefault(); v.currentTime = Math.min(v.duration, v.currentTime + 10) }
      if (e.key === 'm') { v.muted = !v.muted }
      if (e.key === 'f') toggleFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing]) // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = () => {
    const v = videoRef.current
    if (v) playing ? v.pause() : v.play()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    const bar = seekRef.current
    if (!v || !bar || !duration) return
    const rect = bar.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (v) v.muted = !v.muted
  }

  const skipBack = (e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (v) v.currentTime = Math.max(0, v.currentTime - 10)
  }

  const skipForward = (e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (v) v.currentTime = Math.min(duration, v.currentTime + 10)
  }

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  return (
    <div>
      <Link
        to={`/devices/${deviceId}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to clips
      </Link>

      {/* ── Player ─────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`relative bg-black rounded-2xl overflow-hidden aspect-video mb-5 shadow-2xl ${showControls ? 'cursor-default' : 'cursor-none'}`}
        onMouseMove={revealControls}
        onMouseLeave={() => playing && setShowControls(false)}
        onTouchStart={revealControls}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          key={url}
          autoPlay
          className="w-full h-full object-contain"
          src={url}
          onPlay={() => { setPlaying(true); scheduleHide() }}
          onPause={() => { setPlaying(false); setShowControls(true); clearTimeout(hideTimer.current) }}
          onEnded={() => { setPlaying(false); setShowControls(true) }}
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
          onDurationChange={() => setDuration(videoRef.current?.duration ?? 0)}
          onVolumeChange={() => setMuted(videoRef.current?.muted ?? false)}
        />

        {/* Controls overlay */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent
            px-4 pt-10 pb-3 transition-opacity duration-200 select-none
            ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Seek bar */}
          <div
            ref={seekRef}
            className="w-full h-1 bg-white/25 rounded-full mb-3.5 cursor-pointer group/seek hover:h-1.5 transition-all"
            onClick={seek}
          >
            <div
              ref={seekFillRef}
              className="h-full bg-brand-500 rounded-full relative"
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/seek:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex items-center gap-1">
            <button type="button" title={playing ? 'Pause' : 'Play'} onClick={togglePlay} className="text-white hover:text-brand-400 transition-colors p-1.5">
              {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            <button type="button" title="Rewind 10 seconds" onClick={skipBack} className="text-white/60 hover:text-white transition-colors p-1.5">
              <RotateCcw size={14} />
            </button>
            <button type="button" title="Forward 10 seconds" onClick={skipForward} className="text-white/60 hover:text-white transition-colors p-1.5">
              <RotateCw size={14} />
            </button>

            <span className="text-white/70 text-xs font-mono tabular-nums ml-1">
              {fmt(currentTime)} / {fmt(duration)}
            </span>

            <div className="flex-1" />

            <button type="button" title={muted ? 'Unmute' : 'Mute'} onClick={e => { e.stopPropagation(); toggleMute() }} className="text-white/60 hover:text-white transition-colors p-1.5">
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button type="button" title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={e => { e.stopPropagation(); toggleFullscreen() }} className="text-white/60 hover:text-white transition-colors p-1.5">
              {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Clip info ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{fileName}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mt-0.5">
            {deviceId?.replace(/-/g, ' ')} · Space · ← → 10s · M mute · F fullscreen
          </p>
        </div>
        <a
          href={url}
          download={fileName}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border rounded-lg text-sm font-medium hover:border-brand-500/50 transition-colors"
        >
          <Download size={15} />
          Download
        </a>
      </div>
    </div>
  )
}
