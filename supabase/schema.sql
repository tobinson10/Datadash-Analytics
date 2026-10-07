-- Run in the Supabase SQL editor after creating the project.
create type public.plan_name as enum ('free', 'starter', 'pro');
create type public.membership_role as enum ('owner', 'member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan public.plan_name not null default 'free',
  created_at timestamptz not null default now()
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role public.membership_role not null default 'member',
  primary key (workspace_id, user_id)
);
create table public.datasets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  original_name text not null,
  storage_path text not null unique,
  row_count integer check (row_count >= 0),
  column_count integer check (column_count >= 0),
  created_at timestamptz not null default now()
);
create table public.dashboards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  dataset_id uuid references public.datasets(id) on delete set null,
  name text not null check (char_length(name) between 1 and 160),
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  provider text not null default 'paystack',
  provider_customer_code text unique,
  provider_subscription_code text unique,
  plan public.plan_name not null default 'free',
  status text not null default 'active' check (status in ('active','trialing','past_due','cancelled','expired')),
  current_period_end timestamptz
);
create table public.usage_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  dashboard_creations integer not null default 0 check (dashboard_creations >= 0),
  unique (user_id, period_start)
);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.datasets enable row level security;
alter table public.dashboards enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_periods enable row level security;

create policy "read own profile" on public.profiles for select using (id = auth.uid());
create policy "read membership" on public.workspace_members for select using (user_id = auth.uid());
create policy "read accessible workspaces" on public.workspaces for select using (exists (select 1 from public.workspace_members m where m.workspace_id = id and m.user_id = auth.uid()));
create policy "read accessible datasets" on public.datasets for select using (exists (select 1 from public.workspace_members m where m.workspace_id = public.datasets.workspace_id and m.user_id = auth.uid()));
create policy "read accessible dashboards" on public.dashboards for select using (exists (select 1 from public.workspace_members m where m.workspace_id = public.dashboards.workspace_id and m.user_id = auth.uid()));
create policy "read own subscription" on public.subscriptions for select using (user_id = auth.uid());
create policy "read own usage" on public.usage_periods for select using (user_id = auth.uid());

-- Payment webhooks and server-side actions use the service role.
-- Do not add browser write policies for subscriptions or usage.
