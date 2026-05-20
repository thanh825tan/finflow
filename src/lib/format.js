// Format số tiền theo VND
export const formatCurrency = (amount, opts = {}) => {
  const { compact = false, sign = false } = opts
  const num = Number(amount) || 0
  const abs = Math.abs(num)

  if (compact && abs >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (compact && abs >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`
  }

  const formatted = new Intl.NumberFormat('vi-VN').format(Math.round(num))
  if (sign && num > 0) return `+${formatted} đ`
  return `${formatted} đ`
}

// Format ngày dd/MM/yyyy
export const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Lấy ngày đầu/cuối tháng
export const getMonthRange = (year, month) => {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

// Tên tháng tiếng Việt
export const monthLabel = (year, month) => `Tháng ${month}, ${year}`

// Tính % thay đổi
export const percentChange = (current, previous) => {
  if (!previous || previous === 0) return 0
  return ((current - previous) / previous) * 100
}
