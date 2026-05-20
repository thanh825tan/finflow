import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { getCategoryEmoji, CATEGORY_ICONS } from '../lib/categoryIcons';
import IconPicker from '../components/IconPicker';

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [form, setForm] = useState({ name: '', icon: 'other', color: '#6366F1', type: 'expense' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('categories').select('*').eq('user_id', user.id).order('name');
    setCategories(data || []);
  };

  useEffect(() => { load(); }, [user]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', icon: 'other', color: '#6366F1', type: activeTab });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      icon: cat.icon || 'other',
      color: cat.color || '#6366F1',
      type: cat.type,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      icon: form.icon,
      color: form.color,
      type: form.type,
    };
    let res;
    if (editing) {
      res = await supabase.from('categories').update(payload).eq('id', editing.id);
    } else {
      res = await supabase.from('categories').insert(payload);
    }
    setSaving(false);
    if (res.error) {
      alert(res.error.message);
      return;
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Xóa danh mục "${cat.name}"? Các giao dịch dùng danh mục này sẽ bị mất liên kết.`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) {
      alert(error.message);
      return;
    }
    load();
  };

  const filtered = categories.filter((c) => c.type === activeTab);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Danh mục</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Thêm
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
        <button
          onClick={() => setActiveTab('expense')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium ${
            activeTab === 'expense'
              ? 'bg-rose-500 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Chi tiêu
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium ${
            activeTab === 'income'
              ? 'bg-emerald-500 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Thu nhập
        </button>
      </div>

      {/* Grid danh mục */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((cat) => {
          const emoji = getCategoryEmoji(cat);
          return (
            <div key={cat.id} className="group bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${cat.color || '#64748B'}20` }}
              >
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{cat.name}</div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(cat)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">
            Chưa có danh mục nào. Bấm "Thêm" để tạo.
          </div>
        )}
      </div>

      {/* Modal thêm/sửa */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editing ? 'Sửa danh mục' : 'Thêm danh mục'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Preview + icon picker trigger */}
            <button
              type="button"
              onClick={() => setIconPickerOpen(true)}
              className="mx-auto block mb-4 group"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto border-2 border-dashed border-slate-300 dark:border-slate-600 group-hover:border-indigo-500"
                style={{ backgroundColor: `${form.color}20` }}
              >
                {CATEGORY_ICONS[form.icon]?.emoji || '📦'}
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 text-center">Đổi biểu tượng</div>
            </button>

            <div className="space-y-3">
              {/* Tên */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tên danh mục *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                  placeholder="VD: Ăn uống"
                />
              </div>

              {/* Loại */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Loại</label>
                <div className="grid grid-cols-2 gap-2 mt-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                  <button
                    onClick={() => setForm({ ...form, type: 'expense' })}
                    className={`py-2 rounded-md text-sm font-medium ${
                      form.type === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Chi tiêu
                  </button>
                  <button
                    onClick={() => setForm({ ...form, type: 'income' })}
                    className={`py-2 rounded-md text-sm font-medium ${
                      form.type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Thu nhập
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Icon picker modal */}
      <IconPicker
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        currentIcon={form.icon}
        currentColor={form.color}
        onSelect={({ icon, color }) => setForm({ ...form, icon, color })}
      />
    </div>
  );
}
