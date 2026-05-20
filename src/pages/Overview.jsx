import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate, getMonthRange, monthLabel, percentChange } from '../lib/format';
import { getCategoryEmoji } from '../lib/categoryIcons';
import { useDashboard } from '../hooks/useDashboard';
import TransactionModal from '../components/TransactionModal';
import {
  Wallet, ShoppingBag, PiggyBank, CreditCard,
  ChevronLeft, ChevronRight, ChevronRight as ArrowRight,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  // Hook trả về FLAT structure: { income, expense, savings, balance, prevIncome, prevExpense, prevSavings, byCategory, byDay, recent, loading, refetch }
  const {
    income = 0,
    expense = 0,
    savings = 0,
    balance = 0,
    prevIncome = 0,
    prevExpense = 0,
    prevSavings = 0,
    byCategory = [],
    byDay = [],
    recent = [],
    loading,
    refetch,
  } = useDashboard(currentYear, currentMonth);

  // State riêng cho budget + categories + accounts (hook không cover)
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [budgetData, setBudgetData] = useState([]);

  // Modal state
  const [editingTx, setEditingTx] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const gotoPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const gotoNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const loadExtras = async () => {
    if (!user) return;
    const { start, end } = getMonthRange(currentYear, currentMonth);

    // Categories + accounts cho modal
    const { data: cats } = await supabase.from('categories').select('*').eq('user_id', user.id);
    setCategories(cats || []);
    const { data: accs } = await supabase.from('accounts').select('*').eq('user_id', user.id);
    setAccounts(accs || []);

    // Budget
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .eq('year', currentYear);

    const budgetWithSpent = await Promise.all(
      (budgets || []).map(async (b) => {
        const { data: spent } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('category_id', b.category_id)
          .eq('type', 'expense')
          .gte('date', start)
          .lte('date', end);
        const total = (spent || []).reduce((s, t) => s + parseFloat(t.amount || 0), 0);
        return { ...b, spent: total };
      })
    );
    budgetWithSpent.sort((a, b) => (b.spent / Math.max(b.amount, 1)) - (a.spent / Math.max(a.amount, 1)));
    setBudgetData(budgetWithSpent.slice(0, 5));
  };

  useEffect(() => {
    loadExtras();
  }, [user, currentYear, currentMonth]);

  const handleRowClick = (tx) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleSaved = () => {
    refetch();      // refresh data từ hook
    loadExtras();   // refresh budget
  };

  const statCards = [
    {
      label: 'Tổng thu nhập',
      value: income,
      prev: prevIncome,
      icon: Wallet,
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Tổng chi tiêu',
      value: expense,
      prev: prevExpense,
      icon: ShoppingBag,
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      text: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Tiết kiệm',
      value: savings,
      prev: prevSavings,
      icon: PiggyBank,
      bg: 'bg-sky-100 dark:bg-sky-900/30',
      text: 'text-sky-600 dark:text-sky-400',
    },
    {
      label: 'Số dư hiện tại',
      value: balance,
      prev: null,
      icon: CreditCard,
      bg: 'bg-violet-100 dark:bg-violet-900/30',
      text: 'text-violet-600 dark:text-violet-400',
      subtitle: 'Tổng tài sản - Tổng nợ',
    },
  ];

  const PIE_COLORS = ['#3B82F6', '#F43F5E', '#F59E0B', '#8B5CF6', '#10B981', '#64748B', '#EC4899'];

  // Slice top 5 cho recent từ hook (hook đã trả 5 nhưng cho chắc)
  const recentTxs = (recent || []).slice(0, 5);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Tổng quan</h2>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700">
          <button onClick={gotoPrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[110px] text-center">
            {monthLabel(currentYear, currentMonth)}
          </span>
          <button onClick={gotoNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const change = card.prev !== null && card.prev !== 0 ? percentChange(card.value, card.prev) : null;
          return (
            <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-slate-100 dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{card.label}</div>
                  <div className={`text-lg md:text-2xl font-bold mt-1 ${card.text}`}>
                    {formatCurrency(card.value)}
                  </div>
                  {change !== null && isFinite(change) && (
                    <div className={`text-xs mt-1 flex items-center gap-1 ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(change).toFixed(1)}% so với tháng trước
                    </div>
                  )}
                  {card.subtitle && (
                    <div className="text-xs text-slate-400 mt-1">{card.subtitle}</div>
                  )}
                </div>
                <div className={`${card.bg} ${card.text} p-2 rounded-lg`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Donut + Line charts */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Chi tiêu theo danh mục</h3>
          {byCategory.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-44 h-44 relative">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={2}>
                      {byCategory.map((c, i) => (
                        <Cell key={i} fill={c.color || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <div className="text-xs text-slate-500">Tổng chi tiêu</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(expense)}</div>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 w-full">
                {byCategory.slice(0, 6).map((c, i) => (
                  <div key={c.name} className="flex items-center text-sm gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color || PIE_COLORS[i % PIE_COLORS.length] }} />
                    <div className="flex-1 truncate text-slate-700 dark:text-slate-300">{c.name}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">
                      {expense > 0 ? ((c.value / expense) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Chi tiêu theo ngày</h3>
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" interval={Math.max(0, Math.floor(byDay.length / 6) - 1)} />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2} dot={{ r: 3 }} name="Chi tiêu" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent tx + Budget */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Giao dịch gần đây</h3>
          </div>
          {recentTxs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">Chưa có giao dịch nào</div>
          ) : (
            <div className="space-y-2">
              {recentTxs.map((tx) => {
                const emoji = getCategoryEmoji(tx.categories);
                const color = tx.categories?.color || '#64748B';
                return (
                  <button
                    key={tx.id}
                    onClick={() => handleRowClick(tx)}
                    className="w-full flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {tx.note || tx.categories?.name || 'Giao dịch'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {tx.categories?.name} · {formatDate(tx.date)}
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
          <button
            onClick={() => navigate('/transactions')}
            className="mt-4 w-full flex items-center justify-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium py-2"
          >
            Xem tất cả giao dịch <ArrowRight size={14} />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Ngân sách</h3>
            <button
              onClick={() => navigate('/budgets')}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
            >
              Xem tất cả
            </button>
          </div>
          {budgetData.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Chưa có ngân sách nào cho tháng này
              <button
                onClick={() => navigate('/budgets')}
                className="block mx-auto mt-2 text-indigo-600 dark:text-indigo-400 font-medium"
              >
                + Thiết lập ngân sách
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgetData.map((b) => {
                const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
                const isOver = b.spent > b.amount;
                const isWarn = pct >= 80 && !isOver;
                const emoji = getCategoryEmoji(b.categories);
                const color = b.categories?.color || '#64748B';
                const barColor = isOver ? '#F43F5E' : isWarn ? '#F59E0B' : color;
                return (
                  <div key={b.id}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                           style={{ backgroundColor: `${color}20` }}>
                        {emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {b.categories?.name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTx(null); }}
        transaction={editingTx}
        categories={categories}
        accounts={accounts}
        onSaved={handleSaved}
      />
    </div>
  );
}
