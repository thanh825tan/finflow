import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/format'
import { useTheme } from '../context/ThemeContext'

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState([])
  const [totals, setTotals] = useState({ income: 0, expense: 0 })
  const { theme } = useTheme()

  useEffect(() => { load() }, [year])

  async function load() {
    const { data: tx } = await supabase
      .from('transactions')
      .select('type, amount, date')
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: `T${i + 1}`, income: 0, expense: 0, saving: 0,
    }))

    let totalIncome = 0, totalExpense = 0
    ;(tx || []).forEach(t => {
      const m = new Date(t.date).getMonth()
      const amt = Number(t.amount)
      if (t.type === 'income') { months[m].income += amt; totalIncome += amt }
      if (t.type === 'expense') { months[m].expense += amt; totalExpense += amt }
    })
    months.forEach(m => m.saving = m.income - m.expense)

    setData(months)
    setTotals({ income: totalIncome, expense: totalExpense })
  }

  const isDark = theme === 'dark'
  const gridColor = isDark ? '#334155' : '#E2E8F0'
  const textColor = isDark ? '#94A3B8' : '#64748B'

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tổng thu năm {year}</div>
          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.income)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tổng chi năm {year}</div>
          <div className="text-lg font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(totals.expense)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 col-span-2 lg:col-span-1">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tiết kiệm năm {year}</div>
          <div className={`text-lg font-semibold ${totals.income - totals.expense >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(totals.income - totals.expense)}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Thu chi theo tháng</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1_000_000 ? `${v / 1_000_000}M` : v >= 1000 ? `${v / 1000}K` : v} />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#1E293B' : 'white',
                  border: `1px solid ${gridColor}`,
                  borderRadius: 8, fontSize: 12,
                }}
                formatter={(v) => formatCurrency(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" fill="#10B981" name="Thu" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#F43F5E" name="Chi" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white p-4 border-b border-slate-200 dark:border-slate-700">Chi tiết tháng</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-slate-500 dark:text-slate-400">Tháng</th>
                <th className="text-right p-3 text-xs font-medium text-slate-500 dark:text-slate-400">Thu</th>
                <th className="text-right p-3 text-xs font-medium text-slate-500 dark:text-slate-400">Chi</th>
                <th className="text-right p-3 text-xs font-medium text-slate-500 dark:text-slate-400">Tiết kiệm</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="p-3 text-slate-900 dark:text-white">{m.month}</td>
                  <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(m.income)}</td>
                  <td className="p-3 text-right text-rose-600 dark:text-rose-400">{formatCurrency(m.expense)}</td>
                  <td className={`p-3 text-right font-medium ${m.saving >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(m.saving)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
