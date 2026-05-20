import { useState } from 'react'
import { Save, User, Palette } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Settings() {
  const { user, profile, updateProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateProfile({ full_name: fullName })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Thông tin cá nhân</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
            <input type="text" value={user?.email || ''} disabled
              className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Họ và tên</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : saved ? 'Đã lưu ✓' : 'Lưu'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Giao diện</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTheme('light')}
            className={`flex-1 py-3 text-sm font-medium rounded-lg border-2 ${
              theme === 'light' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
            ☀ Light
          </button>
          <button onClick={() => setTheme('dark')}
            className={`flex-1 py-3 text-sm font-medium rounded-lg border-2 ${
              theme === 'dark' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
            ☾ Dark
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Về FinFlow</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ứng dụng quản lý tài chính cá nhân, dữ liệu được mã hóa và lưu trên Supabase.
        </p>
        <div className="text-xs text-slate-400 mt-2">Phiên bản 1.0.0</div>
      </div>
    </div>
  )
}
