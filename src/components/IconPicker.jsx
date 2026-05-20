import { CATEGORY_ICONS, ICON_KEYS, ICON_COLORS } from '../lib/categoryIcons';
import { X } from 'lucide-react';

export default function IconPicker({ open, onClose, currentIcon, currentColor, onSelect }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
         onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Chọn biểu tượng</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Bảng chọn màu */}
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">MÀU NỀN</div>
            <div className="grid grid-cols-8 gap-2">
              {ICON_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onSelect({ icon: currentIcon, color })}
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    currentColor === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Bảng chọn icon */}
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">BIỂU TƯỢNG</div>
            <div className="grid grid-cols-6 gap-2">
              {ICON_KEYS.map((key) => {
                const item = CATEGORY_ICONS[key];
                const isSelected = currentIcon === key;
                return (
                  <button
                    key={key}
                    onClick={() => onSelect({ icon: key, color: currentColor })}
                    title={item.label}
                    className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition border-2 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-transparent bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {item.emoji}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
