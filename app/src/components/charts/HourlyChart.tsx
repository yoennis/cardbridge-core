import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTheme } from '../../context/ThemeContext'
import type { HourPoint } from '../../utils/analytics'

interface Props { data: HourPoint[]; height?: number }

export default function HourlyChart({ data, height = 160 }: Props) {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  const gridColor = isDark ? '#3f3f46' : '#e2e8f0'
  const textColor = isDark ? '#71717a' : '#94a3b8'

  // Only label every 4 hours to avoid crowding
  const tickFormatter = (v: string) => {
    const h = parseInt(v)
    return h % 4 === 0 ? v : ''
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barSize={8} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 10, fill: textColor }}
          axisLine={false}
          tickLine={false}
          tickFormatter={tickFormatter}
        />
        <YAxis tick={{ fontSize: 10, fill: textColor }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
          contentStyle={{
            background: isDark ? '#18181b' : '#fff',
            border: `1px solid ${isDark ? '#3f3f46' : '#e2e8f0'}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => [v ?? 0, 'clips']}
        />
        <Bar dataKey="clips" fill="#10b981" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
