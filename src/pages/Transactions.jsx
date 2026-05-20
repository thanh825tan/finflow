import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/format';
import { getCategoryEmoji } from '../lib/categoryIcons';
import TransactionModal from '../components/TransactionModal';
import { Plus, Search, Filter } from 'lucide-react';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  const load = async () => {
    if (!user) return;
    const { data: txs } = await supabase
      .from('transactions')
      .select('*, categories(*), accounts(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    setTransactions(txs || []);

    const { data: cats } = await supabase.from('categories').select('*').eq('user_id', user.id);
    setCategories(cats || []);
    const { data: accs } = await supabase.from('accounts').select('*').eq('user_id', user.id);
    setAccounts(accs || []);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      const note = (tx.note || '').toLowerCase();
      const desc = (tx.description || '').toLowerCase();
      const catName = (tx.categories?.name || '').toLowerCase();
      if (!note.includes(q) && !desc.includes(q) && !catName.includes(q)) return false;
    }
    return true;
  });

  const handleRowClick = (tx) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Giao dịch</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Thêm giao dịch
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm giao dịch..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          {['all', 'expense', 'income'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                filterType === t
                  ? t === 'expense'
                    ? 'bg-rose-500 text-white'
                    : t === 'income'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t === 'all' ? 'Tất cả' : t === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Không có giao dịch nào
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map((tx) => {
              const emoji = getCategoryEmoji(tx.categories);
              const color = tx.categories?.color || '#64748B';
              return (
                <button
                  key={tx.id}
                  onClick={() => handleRowClick(tx)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition text-left"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {tx.note || tx.categories?.name || 'Giao dịch'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {tx.categories?.name} · {tx.accounts?.name} · {formatDate(tx.date)}
                    </div>
                  </div>
                  <div className={`text-sm font-semibold flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <TransactionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTx(null); }}
        transaction={editingTx}
        categories={categories}
        accounts={accounts}
        onSaved={load}
      />
    </div>
  );
}
