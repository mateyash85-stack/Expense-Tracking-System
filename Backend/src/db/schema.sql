-- ============================================================
-- Expense Tracking System — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ----------------------------
-- Profiles (extends auth.users)
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------
-- Categories
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT DEFAULT '💰',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- ----------------------------
-- Expense type enum (safe creation)
-- ----------------------------
DO $$ BEGIN
  CREATE TYPE expense_type AS ENUM ('income', 'expense');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------
-- Expenses
-- ----------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  type        expense_type NOT NULL DEFAULT 'expense',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  note        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on edit
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS expenses_updated_at ON public.expenses;
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------
-- Row Level Security (RLS)
-- ----------------------------
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses   ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist, then recreate
DROP POLICY IF EXISTS "profiles: own row"      ON public.profiles;
DROP POLICY IF EXISTS "categories: own rows"   ON public.categories;
DROP POLICY IF EXISTS "expenses: own rows"     ON public.expenses;

CREATE POLICY "profiles: own row"    ON public.profiles   FOR ALL USING (auth.uid() = id);
CREATE POLICY "categories: own rows" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "expenses: own rows"   ON public.expenses   FOR ALL USING (auth.uid() = user_id);
