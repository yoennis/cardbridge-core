import type { Clip } from '../api/client'

export interface DayPoint { date: string; label: string; clips: number; bytes: number }
export interface HourPoint { hour: string; clips: number }

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Last N calendar days, filled with zeros where no clips exist */
export function clipsByDay(clips: Clip[], days = 14): DayPoint[] {
  const counts: Record<string, { clips: number; bytes: number }> = {}
  clips.forEach(c => {
    if (!counts[c.date]) counts[c.date] = { clips: 0, bytes: 0 }
    counts[c.date].clips++
    counts[c.date].bytes += c.size
  })

  const result: DayPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    result.push({ date: key, label: formatLabel(key), ...(counts[key] ?? { clips: 0, bytes: 0 }) })
  }
  return result
}

/** Extracts recording hour from clip filename: "clip_08-32-11.mp4" → 8 */
function extractHour(name: string): number | null {
  const m = name.match(/(\d{2})-\d{2}-\d{2}/)
  return m ? parseInt(m[1], 10) : null
}

export function clipsByHour(clips: Clip[]): HourPoint[] {
  const counts: Record<number, number> = {}
  clips.forEach(c => {
    const h = extractHour(c.name)
    if (h !== null) counts[h] = (counts[h] ?? 0) + 1
  })
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    clips: counts[i] ?? 0,
  }))
}

export interface DeviceShare { name: string; bytes: number; clips: number }

export function storageByDevice(
  allClips: { deviceId: string; clips: Clip[] }[],
  deviceNames: Record<string, string>
): DeviceShare[] {
  return allClips.map(({ deviceId, clips }) => ({
    name: deviceNames[deviceId] ?? deviceId,
    bytes: clips.reduce((s, c) => s + c.size, 0),
    clips: clips.length,
  }))
}

export function totalClipsToday(clips: Clip[]): number {
  const today = new Date().toISOString().split('T')[0]
  return clips.filter(c => c.date === today).length
}

export function lastClipTime(clips: Clip[]): string | null {
  if (!clips.length) return null
  const sorted = [...clips].sort((a, b) => {
    const aHour = extractHour(a.name) ?? 0
    const bHour = extractHour(b.name) ?? 0
    return b.date.localeCompare(a.date) || bHour - aHour
  })
  const last = sorted[0]
  const m = last.name.match(/(\d{2}-\d{2}-\d{2})/)
  return m ? m[1].replace(/-/g, ':') : null
}
