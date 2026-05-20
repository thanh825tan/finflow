import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getMonthRange } from '../lib/format'

// Lấy thống kê tổng quan tháng
export function useDashboard(year, month) {
  const [data, setData] = useState({
    income: 0,
    expense: 0,
    savings: 0,
    balance: 0,
    prevIncome: 0,
    prevExpense: 0,
    prevSavings: 0,
    byCategory: [],
    byDay: [],
    recent: [],
    loading: true,
  })

  useEffect(() => {
    fetchData()
  }, [year, month])

  async function fetchData() {
    setData(d => ({ ...d, loading: true }))

    const { start, end } = getMonthRange(year, month)
    const prev = getMonthRange(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1)

    // Giao dịch tháng hiện tại
    const { data: txs } = await supabase
      .from('transactions')
      .select('*, categories(name, color, icon)')
      .gte('date', start).lte('date', end)
      .order('date', { ascending: false })

    // Giao dịch tháng trước
    const { data: prevTxs } = await supabase
      .from('transactions')
      .select('type, amount')
      .gte('date', prev.start).lte('date', prev.end)

    // Tài khoản (để tính số dư)
    const { data: accs } = await supabase
      .from('accounts')
      .select('balance')

    const income = (txs || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const expense = (txs || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const savings = income - expense

    const prevIncome = (prevTxs || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const prevExpense = (prevTxs || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const prevSavings = prevIncome - prevExpense

    const balance = (accs || []).reduce((s, a) => s + Number(a.balance), 0)

    // Chi tiêu theo danh mục
    const catMap = {}
    ;(txs || []).filter(t => t.type === 'expense').forEach(t => {
      const key = t.category_id || 'uncat'
      const name = t.categories?.name || 'Chưa phân loại'
      const color = t.categories?.color || '#94A3B8'
      if (!catMap[key]) catMap[key] = { name, color, value: 0 }
      catMap[key].value += Number(t.amount)
    })
    const byCategory = Object.values(catMap).sort((a, b) => b.value - a.value)

    // Chi tiêu theo ngày
    const dayMap = {}
    const daysInMonth = new Date(year, month, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      dayMap[d] = { day: d, expense: 0, income: 0 }
    }
    ;(txs || []).forEach(t => {
      const d = new Date(t.date).getDate()
      if (!dayMap[d]) dayMap[d] = { day: d, expense: 0, income: 0 }
      if (t.type === 'expense') dayMap[d].expense += Number(t.amount)
      if (t.type === 'income') dayMap[d].income += Number(t.amount)
    })
    const byDay = Object.values(dayMap).sort((a, b) => a.day - b.day)

    setData({
      income, expense, savings, balance,
      prevIncome, prevExpense, prevSavings,
      byCategory, byDay,
      recent: (txs || []).slice(0, 5),
      loading: false,
    })
  }

  return { ...data, refetch: fetchData }
}
