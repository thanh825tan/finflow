import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState('expense')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

  async function handleDelete(id) {
    if (!confirm('Xóa danh mục này? Giao dịch cũ sẽ thành "chưa phân loại".')) return
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  const filtered = categories.filter(c => c.type === tab)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg w-fit">
          <button onClick={() => setTab('expense')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md ${tab === 'expense' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            Chi tiêu
          </button>
          <button onClick={() => setTab('income')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md ${tab === 'income' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            Thu nhập
          </button>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg">
          <Plus className="w-4 h-4" /> Thêm danh mục
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Chưa có danh mục</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: (c.color || '#94A3B8') + '20' }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color || '#94A3B8' }} />
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</span>
                </div>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CategoryForm type={tab}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }} />
      )}
    </div>
  )
}

function CategoryForm({ type, onClose, onSaved }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366F1')

  const colors = ['#6366F1', '#10B981', '#F43F5E', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6', '#64748B']

  async function handleSubmit(e) {
    e.preventDefault()
    await supabase.from('categories').insert({ user_id: user.id, name, color, type })
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Danh mục {type === 'expense' ? 'chi tiêu' : 'thu nhập'} mới
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tên</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="VD: Cafe, Du lịch..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Màu</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-slate-800' : ''}`}
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
