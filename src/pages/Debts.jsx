import { useEffect, useState } from 'react'
import { Plus, Trash2, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate } from '../lib/format'

export default function Debts() {
  const { user } = useAuth()
  const [debts, setDebts] = useState([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('debts').select('*').order('created_at', { ascending: false })
    setDebts(data || [])
  }

  async function handleDelete(id) {
    if (!confirm('Xóa khoản này?')) return
    await supabase.from('debts').delete().eq('id', id)
    load()
  }

  async function togglePaid(d, paid) {
    await supabase.from('debts').update({ paid_amount: paid, status: paid >= d.amount ? 'closed' : 'active' }).eq('id', d.id)
    load()
  }

  const totalBorrow = debts.filter(d => d.type === 'borrow' && d.status === 'active').reduce((s, d) => s + Number(d.amount) - Number(d.paid_amount), 0)
  const totalLend = debts.filter(d => d.type === 'lend' && d.status === 'active').reduce((s, d) => s + Number(d.amount) - Number(d.paid_amount), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <ArrowDownLeft className="w-4 h-4 text-rose-500" />
            Tôi đang nợ
          </div>
          <div className="text-lg font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(totalBorrow)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            Cho vay
          </div>
          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalLend)}</div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg">
          <Plus className="w-4 h-4" /> Thêm
        </button>
      </div>

      <div className="space-y-2">
        {debts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400">
            Chưa có khoản nào
          </div>
        ) : debts.map(d => {
          const remaining = Number(d.amount) - Number(d.paid_amount)
          const pct = d.amount > 0 ? (d.paid_amount / d.amount * 100) : 0
          return (
            <div key={d.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    d.type === 'borrow' ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
                  }`}>
                    {d.type === 'borrow'
                      ? <ArrowDownLeft className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      : <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{d.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {d.counterparty || '—'}
                      {d.due_date && ` · Hạn ${formatDate(d.due_date)}`}
                      {d.status === 'closed' && ' · Đã tất toán'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${d.type === 'borrow' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatCurrency(d.amount)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Còn {formatCurrency(remaining)}</div>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="Trả/nhận thêm" min="0"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.target.value) {
                      togglePaid(d, Number(d.paid_amount) + Number(e.target.value))
                      e.target.value = ''
                    }
                  }}
                  className="flex-1 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white" />
                <button onClick={() => handleDelete(d.id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showForm && <DebtForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}

function DebtForm({ onClose, onSaved }) {
  const { user } = useAuth()
  const [type, setType] = useState('borrow')
  const [name, setName] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    await supabase.from('debts').insert({
      user_id: user.id,
      type, name, counterparty,
      amount: Number(amount),
      due_date: dueDate || null,
      note,
    })
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Thêm khoản nợ/vay</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            <button type="button" onClick={() => setType('borrow')}
              className={`flex-1 py-2 text-sm font-medium rounded-md ${type === 'borrow' ? 'bg-rose-500 text-white' : 'text-slate-600 dark:text-slate-400'}`}>
              Tôi nợ
            </button>
            <button type="button" onClick={() => setType('lend')}
              className={`flex-1 py-2 text-sm font-medium rounded-md ${type === 'lend' ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-slate-400'}`}>
              Cho vay
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tên khoản</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="VD: Vay anh A mua xe"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Đối tác</label>
            <input type="text" value={counterparty} onChange={e => setCounterparty(e.target.value)}
              placeholder="Tên người/đơn vị"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Số tiền</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Hạn</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
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
