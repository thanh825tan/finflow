import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { X, Trash2 } from 'lucide-react';
import { getCategoryEmoji } from '../lib/categoryIcons';

export default function TransactionModal({ open, onClose, transaction, onSaved, categories, accounts }) {
  const { user } = useAuth();
  const isEdit = !!transaction?.id;

  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category_id: '',
    account_id: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type || 'expense',
        amount: transaction.amount?.toString() || '',
        category_id: transaction.category_id || '',
        account_id: transaction.account_id || '',
        date: transaction.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        note: transaction.note || '',
        description: transaction.description || '',
      });
    } else {
      setForm({
        type: 'expense',
        amount: '',
        category_id: '',
        account_id: '',
        date: new Date().toISOString().slice(0, 10),
        note: '',
        description: '',
      });
    }
    setError('');
  }, [transaction, open]);

  if (!open) return null;

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const handleSave = async () => {
    setError('');
    if (!form.amount || !form.category_id || !form.account_id) {
      setError('Vui lòng điền đủ số tiền, danh mục và tài khoản');
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user.id,
      type: form.type,
      amount: parseFloat(form.amount),
      category_id: form.category_id,
      account_id: form.account_id,
      date: form.date,
      note: form.note,
      description: form.description,
    };

    let res;
    if (isEdit) {
      res = await supabase.from('transactions').update(payload).eq('id', transaction.id);
    } else {
      res = await supabase.from('transactions').insert(payload);
    }
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    onSaved?.();
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm('Xóa giao dịch này?')) return;
    setSaving(true);
    const { error } = await supabase.from('transactions').delete().eq('id', transaction.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEdit ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Toggle type */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
            <button
              onClick={() => setForm({ ...form, type: 'expense', category_id: '' })}
              className={`py-2 rounded-md font-medium text-sm ${
                form.type === 'expense'
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Chi tiêu
            </button>
            <button
              onClick={() => setForm({ ...form, type: 'income', category_id: '' })}
              className={`py-2 rounded-md font-medium text-sm ${
                form.type === 'income'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Thu nhập
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Số tiền *</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
              placeholder="0"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Danh mục *</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="">-- Chọn danh mục --</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCategoryEmoji(c)} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tài khoản *</label>
            <select
              value={form.account_id}
              onChange={(e) => setForm({ ...form, account_id: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="">-- Chọn tài khoản --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngày</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ghi chú</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
              placeholder="VD: Siêu thị VinMart"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
              placeholder="Chi tiết thêm..."
            />
          </div>

          {error && <div className="text-rose-500 text-sm">{error}</div>}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
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
  );
}
