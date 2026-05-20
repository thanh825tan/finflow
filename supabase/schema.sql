-- ============================================================
-- FINFLOW - Supabase Schema
-- Chạy file này 1 lần trên Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================================

-- ============================================================
-- 1. PROFILES: thông tin user (tự động sync với auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'VND',
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: tự tạo profile khi có user mới đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Seed danh mục mặc định cho user mới
  INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Ăn uống',         'utensils',      '#F43F5E', 'expense'),
    (NEW.id, 'Mua sắm',         'shopping-bag',  '#F59E0B', 'expense'),
    (NEW.id, 'Đi lại',          'car',           '#0EA5E9', 'expense'),
    (NEW.id, 'Hóa đơn & dịch vụ','file-text',     '#8B5CF6', 'expense'),
    (NEW.id, 'Giải trí',        'gamepad-2',     '#EC4899', 'expense'),
    (NEW.id, 'Sức khỏe',        'heart-pulse',   '#10B981', 'expense'),
    (NEW.id, 'Giáo dục',        'book-open',     '#6366F1', 'expense'),
    (NEW.id, 'Khác',            'circle-dot',    '#64748B', 'expense'),
    (NEW.id, 'Lương',           'briefcase',     '#10B981', 'income'),
    (NEW.id, 'Thưởng',          'gift',          '#34D399', 'income'),
    (NEW.id, 'Đầu tư',          'trending-up',   '#0EA5E9', 'income'),
    (NEW.id, 'Khác',            'plus-circle',   '#64748B', 'income');

  -- Seed tài khoản mặc định
  INSERT INTO public.accounts (user_id, name, type, balance, color) VALUES
    (NEW.id, 'Tiền mặt',     'cash',     0, '#10B981'),
    (NEW.id, 'Ngân hàng',    'bank',     0, '#6366F1');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. CATEGORIES: danh mục thu/chi
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'circle',
  color TEXT DEFAULT '#6366F1',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);

-- ============================================================
-- 3. ACCOUNTS: tài khoản (tiền mặt, ngân hàng, thẻ tín dụng...)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit', 'ewallet', 'savings')),
  balance NUMERIC(18, 2) DEFAULT 0,
  color TEXT DEFAULT '#6366F1',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);

-- ============================================================
-- 4. TRANSACTIONS: giao dịch thu/chi
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC(18, 2) NOT NULL,
  note TEXT,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(user_id, date DESC);

-- ============================================================
-- 5. BUDGETS: ngân sách theo danh mục/tháng
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(18, 2) NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_id, month, year)
);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id, year, month);

-- ============================================================
-- 6. GOALS: mục tiêu tiết kiệm
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(18, 2) NOT NULL,
  current_amount NUMERIC(18, 2) DEFAULT 0,
  deadline DATE,
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT '#6366F1',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);

-- ============================================================
-- 7. DEBTS: nợ & vay
-- ============================================================
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('borrow', 'lend')), -- borrow: tôi nợ, lend: cho vay
  amount NUMERIC(18, 2) NOT NULL,
  paid_amount NUMERIC(18, 2) DEFAULT 0,
  counterparty TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  interest_rate NUMERIC(5, 2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_debts_user ON public.debts(user_id);

-- ============================================================
-- 8. ROW LEVEL SECURITY: mỗi user chỉ thấy data của mình
-- ============================================================
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts        ENABLE ROW LEVEL SECURITY;

-- Policy chuẩn: SELECT/INSERT/UPDATE/DELETE chỉ với data của chính mình
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['categories', 'accounts', 'transactions', 'budgets', 'goals', 'debts'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "own_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "own_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "own_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "own_delete" ON public.%I', tbl);

    EXECUTE format('CREATE POLICY "own_select" ON public.%I FOR SELECT USING (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "own_insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "own_update" ON public.%I FOR UPDATE USING (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "own_delete" ON public.%I FOR DELETE USING (auth.uid() = user_id)', tbl);
  END LOOP;
END $$;

-- Profile có policy riêng (id chính là user_id)
DROP POLICY IF EXISTS "profile_select" ON public.profiles;
DROP POLICY IF EXISTS "profile_update" ON public.profiles;
CREATE POLICY "profile_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- DONE
-- ============================================================
