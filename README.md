# FinFlow — Ứng dụng quản lý tài chính cá nhân

App quản lý chi tiêu và tích lũy cá nhân, đa người dùng, lưu trên Supabase.

## Tính năng
- **Tổng quan:** thu/chi/tiết kiệm/số dư + biểu đồ tròn theo danh mục + biểu đồ đường theo ngày
- **Giao dịch:** thêm/sửa/xóa, tìm kiếm, lọc theo loại
- **Ngân sách:** hạn mức theo danh mục/tháng, cảnh báo khi vượt 80%/100%
- **Mục tiêu:** mục tiêu tiết kiệm với deadline + progress bar
- **Nợ & vay:** theo dõi khoản nợ + cho vay, ghi nhận trả từng đợt
- **Tài khoản:** quản lý tiền mặt/ngân hàng/thẻ tín dụng/ví/tiết kiệm
- **Danh mục:** tự thêm/xóa danh mục thu/chi
- **Báo cáo:** so sánh thu chi 12 tháng + bảng chi tiết
- **Cài đặt:** đổi tên, đổi theme light/dark
- **Auth:** email/password + Google OAuth
- **Multi-user:** mỗi user chỉ thấy dữ liệu của mình (RLS)

## Stack
- React 18 + Vite + React Router
- Tailwind CSS (dark mode)
- Supabase (PostgreSQL + Auth + RLS)
- Recharts (biểu đồ)
- Lucide icons

---

## CÀI ĐẶT (làm 1 lần)

### Bước 1: Setup Supabase

1. Đăng nhập [supabase.com](https://supabase.com) → vào project của anh
2. Vào **SQL Editor** → New query
3. Mở file `supabase/schema.sql`, copy toàn bộ → paste vào → bấm **Run**
4. Vào **Settings → API**, lấy 2 giá trị:
   - `Project URL` (dạng `https://xxxxx.supabase.co`)
   - `anon public` key

### Bước 2: Bật Google OAuth (tùy chọn)

1. Vào **Authentication → Providers → Google → Enable**
2. Tạo OAuth client ở [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Application type: Web application
   - Authorized redirect URIs: `https://<project-id>.supabase.co/auth/v1/callback`
3. Copy Client ID + Secret về Supabase, bấm Save

### Bước 3: Cài project trên máy

```bash
cd C:\Users\ADMIN\finflow
npm install
```

Tạo file `.env` (copy từ `.env.example`):
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx...
```

### Bước 4: Chạy thử local

```bash
npm run dev
```

Mở http://localhost:5173 — đăng ký tài khoản và test.

---

## DEPLOY LÊN GITHUB PAGES

### Lần đầu

1. Tạo repo trên GitHub tên `finflow` (public)
2. Trong project:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/thanh825tan/finflow.git
git push -u origin main
```

3. Vào **Supabase → Authentication → URL Configuration**, thêm vào **Site URL** và **Redirect URLs**:
```
https://thanh825tan.github.io/finflow/
https://thanh825tan.github.io/finflow/**
```

4. Vào **GitHub repo → Settings → Pages**, chọn:
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** (sẽ có sau lần deploy đầu)

5. Deploy:
```bash
npm run deploy
```

App sẽ chạy tại: `https://thanh825tan.github.io/finflow/`

### Cập nhật sau này

```bash
git add .
git commit -m "..."
git push
npm run deploy
```

---

## CẤU TRÚC THƯ MỤC

```
finflow/
├── supabase/
│   └── schema.sql           # SQL setup (chạy 1 lần)
├── src/
│   ├── pages/               # 9 trang chính
│   ├── components/Layout.jsx
│   ├── context/             # Auth + Theme
│   ├── hooks/useDashboard.js
│   ├── lib/                 # supabase client + format helper
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env                     # KHÔNG commit (đã có trong .gitignore)
```

## LƯU Ý BẢO MẬT

- File `.env` đã có trong `.gitignore`, không bao giờ commit lên GitHub
- `anon key` của Supabase là PUBLIC, an toàn để dùng ở frontend
- Row Level Security (RLS) đảm bảo user A KHÔNG thể đọc data của user B kể cả có anon key
- Đừng share `service_role key` (nếu thấy ở Settings → API)

## TROUBLESHOOTING

**Lỗi "Missing Supabase env":** Chưa tạo file `.env` hoặc tên biến sai. Phải có tiền tố `VITE_`.

**Đăng nhập Google không redirect được:** Chưa thêm domain vào Authentication → URL Configuration trên Supabase.

**Hiển thị trắng tinh sau deploy:** Kiểm tra `base: '/finflow/'` trong `vite.config.js` phải khớp tên repo.

**Lỗi 404 khi refresh trang:** Bình thường vì dùng HashRouter (URL có `#/`). Đây là cách workaround cho GitHub Pages.
