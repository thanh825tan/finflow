// Kho icon emoji cho danh mục - dùng chung Categories, Transactions, Overview
// Mỗi icon là 1 emoji, lưu vào DB field categories.icon

export const CATEGORY_ICONS = {
  // Ăn uống & Đồ uống
  food: { emoji: '🍔', label: 'Ăn uống' },
  restaurant: { emoji: '🍽️', label: 'Nhà hàng' },
  coffee: { emoji: '☕', label: 'Cà phê' },
  drink: { emoji: '🥤', label: 'Đồ uống' },
  beer: { emoji: '🍺', label: 'Bia rượu' },
  groceries: { emoji: '🛒', label: 'Tạp hóa' },

  // Mua sắm
  shopping: { emoji: '🛍️', label: 'Mua sắm' },
  clothes: { emoji: '👕', label: 'Quần áo' },
  shoes: { emoji: '👟', label: 'Giày dép' },
  beauty: { emoji: '💄', label: 'Làm đẹp' },
  gift: { emoji: '🎁', label: 'Quà tặng' },

  // Đi lại
  transport: { emoji: '🚗', label: 'Đi lại' },
  taxi: { emoji: '🚕', label: 'Taxi/Grab' },
  bus: { emoji: '🚌', label: 'Xe buýt' },
  fuel: { emoji: '⛽', label: 'Xăng dầu' },
  parking: { emoji: '🅿️', label: 'Đỗ xe' },
  flight: { emoji: '✈️', label: 'Máy bay' },

  // Nhà & Hóa đơn
  home: { emoji: '🏠', label: 'Nhà ở' },
  rent: { emoji: '🏘️', label: 'Tiền thuê' },
  electric: { emoji: '💡', label: 'Điện' },
  water: { emoji: '💧', label: 'Nước' },
  internet: { emoji: '📶', label: 'Internet' },
  phone: { emoji: '📱', label: 'Điện thoại' },
  bill: { emoji: '🧾', label: 'Hóa đơn' },

  // Sức khỏe
  health: { emoji: '🏥', label: 'Sức khỏe' },
  medicine: { emoji: '💊', label: 'Thuốc' },
  gym: { emoji: '💪', label: 'Gym' },

  // Giáo dục
  education: { emoji: '📚', label: 'Giáo dục' },
  book: { emoji: '📖', label: 'Sách' },
  course: { emoji: '🎓', label: 'Khóa học' },

  // Giải trí
  entertainment: { emoji: '🎬', label: 'Giải trí' },
  game: { emoji: '🎮', label: 'Game' },
  music: { emoji: '🎵', label: 'Âm nhạc' },
  travel: { emoji: '🧳', label: 'Du lịch' },
  sport: { emoji: '⚽', label: 'Thể thao' },

  // Thú cưng & Trẻ em
  pet: { emoji: '🐶', label: 'Thú cưng' },
  baby: { emoji: '👶', label: 'Trẻ em' },

  // Thu nhập
  salary: { emoji: '💰', label: 'Lương' },
  bonus: { emoji: '🎉', label: 'Thưởng' },
  freelance: { emoji: '💼', label: 'Freelance' },
  investment: { emoji: '📈', label: 'Đầu tư' },
  interest: { emoji: '🏦', label: 'Lãi suất' },
  refund: { emoji: '↩️', label: 'Hoàn tiền' },

  // Tài chính
  savings: { emoji: '🐷', label: 'Tiết kiệm' },
  loan: { emoji: '💳', label: 'Vay/Trả nợ' },
  insurance: { emoji: '🛡️', label: 'Bảo hiểm' },
  tax: { emoji: '📋', label: 'Thuế' },

  // Khác
  other: { emoji: '📦', label: 'Khác' },
  donate: { emoji: '❤️', label: 'Từ thiện' },
  family: { emoji: '👨‍👩‍👧', label: 'Gia đình' },
  friend: { emoji: '🤝', label: 'Bạn bè' },
};

// Danh sách key để render trong icon picker
export const ICON_KEYS = Object.keys(CATEGORY_ICONS);

// Get emoji từ category - ưu tiên field icon trong DB, fallback theo tên
export function getCategoryEmoji(category) {
  if (!category) return '📦';
  // Nếu icon là 1 emoji trực tiếp (đã được chọn từ picker)
  if (category.icon && category.icon.length <= 4 && !CATEGORY_ICONS[category.icon]) {
    return category.icon;
  }
  // Nếu icon là key của CATEGORY_ICONS
  if (category.icon && CATEGORY_ICONS[category.icon]) {
    return CATEGORY_ICONS[category.icon].emoji;
  }
  // Fallback: đoán theo tên
  const name = (category.name || '').toLowerCase();
  if (name.includes('ăn') || name.includes('food')) return '🍔';
  if (name.includes('mua sắm') || name.includes('shop')) return '🛍️';
  if (name.includes('đi lại') || name.includes('xe')) return '🚗';
  if (name.includes('hóa đơn') || name.includes('điện') || name.includes('nước')) return '🧾';
  if (name.includes('giải trí')) return '🎬';
  if (name.includes('sức khỏe') || name.includes('y tế')) return '🏥';
  if (name.includes('giáo dục') || name.includes('học')) return '📚';
  if (name.includes('lương')) return '💰';
  if (name.includes('thưởng')) return '🎉';
  if (name.includes('đầu tư')) return '📈';
  if (name.includes('khác')) return '📦';
  return '📦';
}

// Bảng màu cho icon background
export const ICON_COLORS = [
  '#F43F5E', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#10B981', '#14B8A6', '#06B6D4',
  '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#64748B',
];
