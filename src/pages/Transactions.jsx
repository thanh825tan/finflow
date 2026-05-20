import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate } from '../lib/format'

export default function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [tx, cat, acc] = await Promise.all([
      supabase.from('transactions').select('*, categories(name, color), accounts(name)').order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('accounts').select('*').order('name'),
    ])
    setTransactions(tx.data || [])
    setCategories(cat.data || [])
    setAccounts(acc.data || [])
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Xóa giao dịch này?')) return
    await supabase.from('transactions').delete().eq('id', id)
    loadAll()
  }

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false
    const q = search.toLowerCase()
    if (!q) return true
    return (
      t.description?.toLowerCase().includes(q) ||
      t.note?.toLowerCase().includes(q) ||
      t.categories?.name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm giao dịch..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          >
            <option value="all">Tất cả</option>
            <option value="income">Thu</option>
            <option value="expense">Chi</option>
          </select>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
        >
          <Plus className="w-4 h-4" /> Thêm giao dịch
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Không có giao dịch nào</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: (t.categories?.color || '#94A3B8') + '20' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: t.categories?.color || '#94A3B8' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {t.description || t.note || 'Giao dịch'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t.categories?.name || 'Chưa phân loại'} · {t.accounts?.name || ''} · {formatDate(t.date)}
                  </div>
                </div>
                <div className={`text-sm font-semibold ${
                  t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(t); setShowForm(true) }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    <Edit2 className="w-4 h-4 text-slate-400" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TransactionForm
          editing={editing}
          categories={categories}
          accounts={accounts}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadAll() }}
        />
      )}
    </div>
  )
}

function TransactionForm({ editing, categories, accounts, onClose, onSaved }) {
  const { user } = useAuth()
  const [type, setType] = useState(editing?.type || 'expense')
  const [amount, setAmount] = useState(editing?.amount || '')
  const [categoryId, setCategoryId] = useState(editing?.category_id || '')
  const [accountId, setAccountId] = useState(editing?.account_id || '')
  const [description, setDescription] = useState(editing?.description || '')
  const [note, setNote] = useState(editing?.note || '')
  const [date, setDate] = useState(editing?.date || new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  const filteredCats = categories.filter(c => c.type === type)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      user_id: user.id,
      type,
      amount: Number(amount),
      category_id: categoryId || null,
      account_id: accountId || null,
      description, note, date,
    }
    if (editing) {
      await supabase.from('transactions').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('transactions').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {editing ? 'Sửa giao dịch' : 'Thêm giao dịch'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            <button type="button" onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                type === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}>Chi</button>
            <button type="button" onClick={() => setType('income')}
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}>Thu</button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Số tiền</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="any"
              placeholder="0"
              className="w-full px-3 py-2.5 text-base font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Danh mục</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
              <option value="">— Chọn danh mục —</option>
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tài khoản</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
              <option value="">— Chọn tài khoản —</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Mô tả</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="VD: Siêu thị VinMart"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Ngày</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Ghi chú</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
              Hủy
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
