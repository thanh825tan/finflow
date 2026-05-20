import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Wallet, Building2, CreditCard, Smartphone, PiggyBank, Edit2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../lib/format'

const TYPES = {
  cash: { label: 'Tiền mặt', icon: Wallet },
  bank: { label: 'Ngân hàng', icon: Building2 },
  credit: { label: 'Thẻ tín dụng', icon: CreditCard },
  ewallet: { label: 'Ví điện tử', icon: Smartphone },
  savings: { label: 'Tiết kiệm', icon: PiggyBank },
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('accounts').select('*').order('created_at')
    setAccounts(data || [])
  }

  async function handleDelete(id) {
    if (!confirm('Xóa tài khoản này? Các giao dịch liên quan vẫn được giữ.')) return
    await supabase.from('accounts').delete().eq('id', id)
    load()
  }

  const total = accounts.reduce((s, a) => s + Number(a.balance), 0)

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl p-5 text-white">
        <div className="text-xs opacity-80 mb-1">Tổng tài sản</div>
        <div className="text-2xl font-bold">{formatCurrency(total)}</div>
        <div className="text-xs opacity-80 mt-1">{accounts.length} tài khoản</div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg">
          <Plus className="w-4 h-4" /> Thêm tài khoản
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {accounts.map(a => {
          const TypeIcon = TYPES[a.type]?.icon || Wallet
          return (
            <div key={a.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: (a.color || '#6366F1') + '20' }}>
                    <TypeIcon className="w-5 h-5" style={{ color: a.color || '#6366F1' }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{a.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{TYPES[a.type]?.label}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(a); setShowForm(true) }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    <Edit2 className="w-4 h-4 text-slate-400" />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{formatCurrency(a.balance)}</div>
              {a.note && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{a.note}</div>}
            </div>
          )
        })}
      </div>

      {showForm && (
        <AccountForm editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }} />
      )}
    </div>
  )
}

function AccountForm({ editing, onClose, onSaved }) {
  const { user } = useAuth()
  const [name, setName] = useState(editing?.name || '')
  const [type, setType] = useState(editing?.type || 'bank')
  const [balance, setBalance] = useState(editing?.balance || '0')
  const [color, setColor] = useState(editing?.color || '#6366F1')
  const [note, setNote] = useState(editing?.note || '')

  const colors = ['#6366F1', '#10B981', '#F43F5E', '#0EA5E9', '#8B5CF6', '#F59E0B']

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { user_id: user.id, name, type, balance: Number(balance), color, note }
    if (editing) {
      await supabase.from('accounts').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('accounts').insert(payload)
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {editing ? 'Sửa tài khoản' : 'Thêm tài khoản'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tên</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="VD: Vietcombank"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Loại</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Số dư</label>
            <input type="number" value={balance} onChange={e => setBalance(e.target.value)} required
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
