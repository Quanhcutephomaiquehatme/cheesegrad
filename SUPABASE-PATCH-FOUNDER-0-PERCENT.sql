-- CHEESE.GRADUATION — FOUNDER 0%
-- Chạy toàn bộ file này 1 lần trong Supabase -> SQL Editor.
-- Founder: STU 0% / Founder 100%
-- Đối tác: STU 15% / Photographer 85%
-- Thợ thường: STU 20% / Photographer 80%

alter table public.photographers
  add column if not exists photographer_type text not null default 'regular';

alter table public.photographers
  drop constraint if exists photographers_photographer_type_check;

alter table public.photographers
  add constraint photographers_photographer_type_check
  check (photographer_type in ('founder','partner','regular'));

-- Tự đánh dấu photographer thuộc ekip Founder.
update public.photographers
set photographer_type = 'founder'
where lower(trim(coalesce(team,''))) = 'founder';

-- Nếu bảng dòng tiền đã tồn tại, mở rộng constraint để nhận Founder.
do $$
begin
  if to_regclass('public.booking_finance') is not null then
    alter table public.booking_finance
      drop constraint if exists booking_finance_photographer_type_check;

    alter table public.booking_finance
      add constraint booking_finance_photographer_type_check
      check (photographer_type in ('founder','partner','regular'));
  end if;
end
$$;

notify pgrst, 'reload schema';
