create or replace function public.consume_dashboard_creation(p_user_id uuid, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  accepted boolean;
begin
  insert into public.usage_periods (user_id, period_start, dashboard_creations)
  values (p_user_id, date_trunc('month', current_date)::date, 1)
  on conflict (user_id, period_start) do update
    set dashboard_creations = public.usage_periods.dashboard_creations + 1
    where public.usage_periods.dashboard_creations < p_limit
  returning true into accepted;

  return coalesce(accepted, false);
end;
$$;

revoke all on function public.consume_dashboard_creation(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_dashboard_creation(uuid, integer) to service_role;
