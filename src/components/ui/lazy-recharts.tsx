'use client'

import dynamic from 'next/dynamic'

export const LazyLineChart = dynamic(() => import('recharts').then(m => ({ default: m.LineChart })), { ssr: false })
export const LazyBarChart = dynamic(() => import('recharts').then(m => ({ default: m.BarChart })), { ssr: false })
export const LazyPieChart = dynamic(() => import('recharts').then(m => ({ default: m.PieChart })), { ssr: false })

export {
  Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Pie, Cell
} from 'recharts'
