-- ============================================================
-- Security controls: quotas + security events
-- ============================================================

create table if not exists usage_quotas (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  metric       text        not null,
  period_type  text        not null check (period_type in ('day', 'month')),
  period_start date        not null,
  used_count   integer     not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (user_id, metric, period_type, period_start)
);

create index if not exists idx_usage_quotas_lookup
  on usage_quotas (user_id, metric, period_type, period_start);

create table if not exists security_events (
  id         uuid        primary key default gen_random_uuid(),
  event_type text        not null,
  severity   text        not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  user_id    uuid        references auth.users(id) on delete set null,
  ip         text,
  payload    jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_created_at
  on security_events (created_at desc);

create index if not exists idx_security_events_event_type_created_at
  on security_events (event_type, created_at desc);

-- Server-only tables: keep inaccessible from anon/authenticated direct clients.
revoke all on table usage_quotas from anon, authenticated;
revoke all on table security_events from anon, authenticated;

create or replace function consume_product_quota(
  p_user_id uuid,
  p_metric text,
  p_day_limit integer,
  p_month_limit integer
)
returns table(
  allowed boolean,
  reason text,
  day_used integer,
  month_used integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day_start date := timezone('utc', now())::date;
  v_month_start date := date_trunc('month', timezone('utc', now()))::date;
  v_day_count integer;
  v_month_count integer;
begin
  -- Ensure monthly row exists and lock it.
  insert into usage_quotas (user_id, metric, period_type, period_start, used_count)
  values (p_user_id, p_metric, 'month', v_month_start, 0)
  on conflict do nothing;

  select used_count
    into v_month_count
  from usage_quotas
  where user_id = p_user_id
    and metric = p_metric
    and period_type = 'month'
    and period_start = v_month_start
  for update;

  if v_month_count >= p_month_limit then
    return query select false, 'monthly_limit', 0, v_month_count;
    return;
  end if;

  -- Ensure daily row exists and lock it.
  insert into usage_quotas (user_id, metric, period_type, period_start, used_count)
  values (p_user_id, p_metric, 'day', v_day_start, 0)
  on conflict do nothing;

  select used_count
    into v_day_count
  from usage_quotas
  where user_id = p_user_id
    and metric = p_metric
    and period_type = 'day'
    and period_start = v_day_start
  for update;

  if v_day_count >= p_day_limit then
    return query select false, 'daily_limit', v_day_count, v_month_count;
    return;
  end if;

  update usage_quotas
  set used_count = used_count + 1,
      updated_at = now()
  where user_id = p_user_id
    and metric = p_metric
    and period_type = 'day'
    and period_start = v_day_start
  returning used_count into v_day_count;

  update usage_quotas
  set used_count = used_count + 1,
      updated_at = now()
  where user_id = p_user_id
    and metric = p_metric
    and period_type = 'month'
    and period_start = v_month_start
  returning used_count into v_month_count;

  return query select true, ''::text, v_day_count, v_month_count;
end;
$$;

revoke all on function consume_product_quota(uuid, text, integer, integer) from public;
grant execute on function consume_product_quota(uuid, text, integer, integer) to service_role;
