import { Film } from 'lucide-react'
import { useThumbnail } from '../hooks/useThumbnail'

interface Props {
  videoUrl: string
  className?: string
}

export default function ClipThumbnail({ videoUrl, className = '' }: Props) {
  const { thumbnail, loading } = useThumbnail(videoUrl)

  if (loading) {
    return <div className={`bg-slate-200 dark:bg-slate-800 animate-pulse ${className}`} />
  }

  if (!thumbnail) {
    return (
      <div className={`bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${className}`}>
        <Film size={14} className="text-slate-400 dark:text-slate-600" />
      </div>
    )
  }

  return (
    <img
      src={thumbnail}
      alt="clip preview"
      className={`object-cover ${className}`}
    />
  )
}
