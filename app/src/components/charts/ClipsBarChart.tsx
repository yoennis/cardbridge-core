import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTheme } from '../../context/ThemeContext'
import type { DayPoint } from '../../utils/analytics'

interface Props { data: DayPoint[]; height?: number }

export default function ClipsBarChart({ data, height = 180 }: Props) {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  const gridColor = isDark ? '#3f3f46' : '#e2e8f0'
  const textColor = isDark ? '#71717a' : '#94a3b8'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barSize={14} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: textColor }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: textColor }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
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
        <Bar dataKey="clips" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
