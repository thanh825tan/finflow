import { useState } from 'react'
import { TrendingUp, ShoppingBag, PiggyBank, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { useDashboard } from '../hooks/useDashboard'
import { formatCurrency, monthLabel, percentChange } from '../lib/format'
import { useTheme } from '../context/ThemeContext'

export default function Overview() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const { theme } = useTheme()

  const d = useDashboard(year, month)

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const stats = [
    {
      label: 'Tổng thu nhập',
      value: d.income,
      diff: percentChange(d.income, d.prevIncome),
      icon: TrendingUp,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-700 dark:text-emerald-400',
      valueColor: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'Tổng chi tiêu',
      value: d.expense,
      diff: percentChange(d.expense, d.prevExpense),
      icon: ShoppingBag,
      iconBg: 'bg-rose-100 dark:bg-rose-900/40',
      iconColor: 'text-rose-700 dark:text-rose-400',
      valueColor: 'text-rose-700 dark:text-rose-400',
    },
    {
      label: 'Tiết kiệm',
      value: d.savings,
      diff: percentChange(d.savings, d.prevSavings),
      icon: PiggyBank,
      iconBg: 'bg-sky-100 dark:bg-sky-900/40',
      iconColor: 'text-sky-700 dark:text-sky-400',
      valueColor: 'text-sky-700 dark:text-sky-400',
    },
    {
      label: 'Số dư hiện tại',
      value: d.balance,
      sub: 'Tổng tài sản',
      icon: CreditCard,
      iconBg: 'bg-violet-100 dark:bg-violet-900/40',
      iconColor: 'text-violet-700 dark:text-violet-400',
      valueColor: 'text-violet-700 dark:text-violet-400',
    },
  ]

  const isDark = theme === 'dark'
  const gridColor = isDark ? '#334155' : '#E2E8F0'
  const textColor = isDark ? '#94A3B8' : '#64748B'

  return (
    <div className="space-y-4">
      {/* Month picker */}
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="px-3 text-sm font-medium text-slate-900 dark:text-white min-w-[110px] text-center">
            {monthLabel(year, month)}
          </span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                <s.icon className={`w-4 h-4 ${s.iconColor}`} />
              </div>
            </div>
            <div className={`text-lg lg:text-xl font-semibold ${s.valueColor}`}>
              {formatCurrency(s.value)}
            </div>
            {s.diff !== undefined && (
              <div className={`text-xs mt-1 ${s.diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {s.diff >= 0 ? '↑' : '↓'} {Math.abs(s.diff).toFixed(1)}% so với tháng trước
              </div>
            )}
            {s.sub && <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Chi tiêu theo danh mục</h3>
          {d.byCategory.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-sm text-slate-400">
              Chưa có giao dịch trong tháng này
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-40 h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.byCategory} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {d.byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Tổng chi</div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(d.expense, { compact: true })}
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {d.byCategory.slice(0, 6).map((c, i) => {
                  const pct = d.expense > 0 ? (c.value / d.expense * 100) : 0
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                        <span className="truncate text-slate-700 dark:text-slate-200">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-slate-900 dark:text-white font-medium">{formatCurrency(c.value, { compact: true })}</span>
                        <span className="text-slate-400 w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Line */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Chi tiêu theo ngày</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.byDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: textColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: textColor }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${v / 1000}K` : v} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#1E293B' : 'white',
                    border: `1px solid ${gridColor}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => formatCurrency(v)}
                  labelFormatter={(d) => `Ngày ${d}`}
                />
                <Line type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} name="Chi tiêu" />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} name="Thu nhập" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Giao dịch gần đây</h3>
        {d.recent.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-6">Chưa có giao dịch</div>
        ) : (
          <div className="space-y-1">
            {d.recent.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: (t.categories?.color || '#94A3B8') + '20' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: t.categories?.color || '#94A3B8' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {t.description || t.note || 'Giao dịch'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t.categories?.name || 'Chưa phân loại'} · {new Date(t.date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-semibold flex-shrink-0 ${
                  t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
