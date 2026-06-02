import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTheme } from '../../context/ThemeContext'
import type { DeviceShare } from '../../utils/analytics'
import { formatBytes } from '../../utils/format'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

interface Props { data: DeviceShare[]; height?: number }

export default function StorageDonut({ data, height = 200 }: Props) {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius="55%"
          outerRadius="75%"
          paddingAngle={3}
          dataKey="bytes"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: isDark ? '#18181b' : '#fff',
            border: `1px solid ${isDark ? '#3f3f46' : '#e2e8f0'}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v, _name, entry: any) => [
            `${formatBytes(Number(v ?? 0))} · ${entry.payload.clips} clips`,
            entry.payload.name,
          ]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: isDark ? '#a1a1aa' : '#64748b' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
