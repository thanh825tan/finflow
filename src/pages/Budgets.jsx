import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, getMonthRange, monthLabel } from '../lib/format'

export default function Budgets() {
  const { user } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [spent, setSpent] = useState({})
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [year, month])

  async function load() {
    const { start, end } = getMonthRange(year, month)
    const [b, c, tx] = await Promise.all([
      supabase.from('budgets').select('*, categories(name, color)').eq('year', year).eq('month', month),
      supabase.from('categories').select('*').eq('type', 'expense').order('name'),
      supabase.from('transactions').select('category_id, amount').eq('type', 'expense').gte('date', start).lte('date', end),
    ])
    setBudgets(b.data || [])
    setCategories(c.data || [])
    const map = {}
    ;(tx.data || []).forEach(t => {
      if (!t.category_id) return
      map[t.category_id] = (map[t.category_id] || 0) + Number(t.amount)
    })
    setSpent(map)
  }

  async function handleDelete(id) {
    if (!confirm('Xóa ngân sách này?')) return
    await supabase.from('budgets').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg">
          <Plus className="w-4 h-4" /> Thêm ngân sách
        </button>
      </div>

      <div className="grid gap-3">
        {budgets.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400">
            Chưa có ngân sách cho {monthLabel(year, month)}
          </div>
        ) : budgets.map(b => {
          const used = spent[b.category_id] || 0
          const pct = b.amount > 0 ? (used / b.amount * 100) : 0
          const over = pct > 100
          return (
            <div key={b.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: (b.categories?.color || '#94A3B8') + '20' }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: b.categories?.color || '#94A3B8' }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{b.categories?.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatCurrency(used)} / {formatCurrency(b.amount)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${over ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {pct.toFixed(0)}%
                  </span>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${
                  over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <BudgetForm
          year={year} month={month}
          categories={categories}
          existing={budgets.map(b => b.category_id)}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}

function BudgetForm({ year, month, categories, existing, onClose, onSaved }) {
  const { user } = useAuth()
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')

  const available = categories.filter(c => !existing.includes(c.id))

  async function handleSubmit(e) {
    e.preventDefault()
    await supabase.from('budgets').insert({
      user_id: user.id, category_id: categoryId, amount: Number(amount), year, month,
    })
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Ngân sách {monthLabel(year, month)}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Danh mục</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
              <option value="">— Chọn —</option>
              {available.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Hạn mức (VND)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200">
              Hủy
            </button>
            <button type="submit"
              className="flex-1 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-lg">
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
