-- CHEESE.GRADUATION — PATCH DÒNG TIỀN
-- Chạy TOÀN BỘ file này 1 lần trong Supabase -> SQL Editor.
-- Thợ đối tác: STU 15% | Thợ thường: STU 20%

alter table public.photographers
  add column if not exists photographer_type text not null default 'regular';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'photographers_photographer_type_check'
      and conrelid = 'public.photographers'::regclass
  ) then
    alter table public.photographers
      add constraint photographers_photographer_type_check
      check (photographer_type in ('partner','regular'));
  end if;
end
$$;

create table if not exists public.booking_finance (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  photographer_type text not null default 'regular'
    check (photographer_type in ('partner','regular')),
  commission_rate numeric(5,2) not null default 20
    check (commission_rate >= 0 and commission_rate <= 100),

  gross_revenue bigint not null default 0 check (gross_revenue >= 0),
  customer_received bigint not null default 0 check (customer_received >= 0),

  takecare_cost bigint not null default 0 check (takecare_cost >= 0),
  travel_cost bigint not null default 0 check (travel_cost >= 0),
  postproduction_cost bigint not null default 0 check (postproduction_cost >= 0),
  other_cost bigint not null default 0 check (other_cost >= 0),
  other_cost_note text,

  photographer_paid bigint not null default 0 check (photographer_paid >= 0),
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_finance_booking_idx
on public.booking_finance(booking_id);

drop trigger if exists booking_finance_touch_updated_at on public.booking_finance;
create trigger booking_finance_touch_updated_at
before update on public.booking_finance
for each row execute function public.touch_updated_at();

alter table public.booking_finance enable row level security;

drop policy if exists "admin_manage_booking_finance" on public.booking_finance;
create policy "admin_manage_booking_finance"
on public.booking_finance for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.booking_finance to authenticated;

notify pgrst, 'reload schema';
