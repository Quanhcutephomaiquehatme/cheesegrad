-- CHEESE.GRADUATION
-- Vá lỗi: Could not find the table 'public.site_pricing' in the schema cache
-- Chạy TOÀN BỘ file này một lần trong Supabase -> SQL Editor.

create table if not exists public.site_pricing (
  id text primary key default 'main',
  reference_price_from bigint not null default 1500000,
  team_prices jsonb not null default '[]'::jsonb,
  province_groups jsonb not null default '[]'::jsonb,
  province_details jsonb not null default '{}'::jsonb,
  takecare_full_day_rate bigint not null default 400000,
  takecare_half_day_rate bigint not null default 250000,
  updated_at timestamptz not null default now()
);

alter table public.site_pricing
  add column if not exists takecare_full_day_rate bigint not null default 400000;

alter table public.site_pricing
  add column if not exists takecare_half_day_rate bigint not null default 250000;

insert into public.site_pricing (
  id,
  reference_price_from,
  takecare_full_day_rate,
  takecare_half_day_rate
)
values ('main', 1500000, 400000, 250000)
on conflict (id) do nothing;

alter table public.site_pricing enable row level security;

drop policy if exists "public_read_site_pricing" on public.site_pricing;
create policy "public_read_site_pricing"
on public.site_pricing for select
to anon, authenticated
using (true);

drop policy if exists "admin_manage_site_pricing" on public.site_pricing;
create policy "admin_manage_site_pricing"
on public.site_pricing for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.site_pricing to anon, authenticated;
grant insert, update, delete on public.site_pricing to authenticated;

-- Nếu hệ thống Take Care đã có từ bản trước, cho phép giá công thay đổi về sau.
do $$
begin
  if to_regclass('public.takecare_shifts') is not null then
    alter table public.takecare_shifts
      drop constraint if exists takecare_shifts_cost_amount_check;

    alter table public.takecare_shifts
      add constraint takecare_shifts_cost_amount_check
      check (cost_amount >= 0);
  end if;
end
$$;

-- Bắt PostgREST cập nhật schema cache để Admin thấy bảng mới ngay.
notify pgrst, 'reload schema';
