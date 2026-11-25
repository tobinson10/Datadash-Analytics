alter table public.subscriptions
  add column if not exists currency text check (currency in ('NGN', 'USD')),
  add column if not exists provider_plan_code text,
  add column if not exists provider_reference text unique,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists subscriptions_provider_reference_idx
  on public.subscriptions(provider_reference)
  where provider_reference is not null;
