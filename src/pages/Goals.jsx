import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Target } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate } from '../lib/format'

export default function Goals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: false })
    setGoals(data || [])
  }

  async function handleDelete(id) {
    if (!confirm('Xóa mục tiêu này?')) return
    await supabase.from('goals').delete().eq('id', id)
    load()
  }

  async function updateProgress(g, newAmount) {
    await supabase.from('goals').update({ current_amount: newAmount }).eq('id', g.id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg">
          <Plus className="w-4 h-4" /> Thêm mục tiêu
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {goals.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400">
            Chưa có mục tiêu nào
          </div>
        ) : goals.map(g => {
          const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount * 100) : 0
          const done = pct >= 100
          return (
            <div key={g.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: (g.color || '#6366F1') + '20' }}>
                    <Target className="w-5 h-5" style={{ color: g.color || '#6366F1' }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{g.name}</div>
                    {g.deadline && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">Đến {formatDate(g.deadline)}</div>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(g.id)} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>

              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{formatCurrency(g.current_amount)}</span>
                <span className={`font-medium ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-brand-500'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Mục tiêu: {formatCurrency(g.target_amount)}
              </div>

              <div className="flex gap-1">
                <input type="number" placeholder="Nạp thêm" min="0"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.target.value) {
                      updateProgress(g, Number(g.current_amount) + Number(e.target.value))
                      e.target.value = ''
                    }
                  }}
                  className="flex-1 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white" />
              </div>
            </div>
          )
        })}
      </div>

      {showForm && <GoalForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}

function GoalForm({ onClose, onSaved }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('0')
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState('#6366F1')

  const colors = ['#6366F1', '#10B981', '#F43F5E', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EC4899']

  async function handleSubmit(e) {
    e.preventDefault()
    await supabase.from('goals').insert({
      user_id: user.id,
      name,
      target_amount: Number(target),
      current_amount: Number(current),
      deadline: deadline || null,
      color,
    })
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Thêm mục tiêu</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tên mục tiêu</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="VD: Mua xe máy"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Mục tiêu (VND)</label>
              <input type="number" value={target} onChange={e => setTarget(e.target.value)} required min="0"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Đã có</label>
              <input type="number" value={current} onChange={e => setCurrent(e.target.value)} min="0"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Hạn (tùy chọn)</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Màu</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-slate-800' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200">Hủy</button>
            <button type="submit" className="flex-1 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-lg">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  )
}
