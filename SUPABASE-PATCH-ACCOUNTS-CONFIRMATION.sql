-- Chạy một lần sau supabase-setup.sql. Có thể chạy lại an toàn.
-- Thợ chỉ đọc thông tin lịch của hồ sơ gắn với auth.uid(); không nhận tên thợ từ trình duyệt.
begin;
create table if not exists public.photographer_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 photographer_id uuid not null references public.photographers(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.photographer_accounts enable row level security;
revoke all on public.photographer_accounts from anon, authenticated;
grant select, insert, update, delete on public.photographer_accounts to authenticated;
drop policy if exists "admin_manage_photographer_accounts" on public.photographer_accounts;
create policy "admin_manage_photographer_accounts" on public.photographer_accounts for all to authenticated
using (public.is_admin()) with check (public.is_admin());


-- Một thợ = một tài khoản. Nếu dữ liệu cũ có nhiều liên kết, cần chọn một tài khoản trước.
create unique index if not exists photographer_accounts_one_per_photographer on public.photographer_accounts(photographer_id);
alter table public.bookings add column if not exists photographer_confirmed_at timestamptz;
alter table public.bookings add column if not exists photographer_confirmed_by uuid references auth.users(id) on delete set null;
alter table public.bookings add column if not exists schedule_revision integer not null default 1;
alter table public.calendar_events add column if not exists photographer_confirmed_at timestamptz;
alter table public.calendar_events add column if not exists photographer_confirmed_by uuid references auth.users(id) on delete set null;
alter table public.calendar_events add column if not exists schedule_revision integer not null default 1;

create or replace function public.reset_photographer_confirmation()
returns trigger language plpgsql set search_path='' as $$
declare changed boolean;
begin
 if tg_table_name='bookings' then
  changed := (to_jsonb(new) - array['updated_at','status','deposit_amount','deposit_status','internal_note','photographer_confirmed_at','photographer_confirmed_by','schedule_revision'])
    is distinct from (to_jsonb(old) - array['updated_at','status','deposit_amount','deposit_status','internal_note','photographer_confirmed_at','photographer_confirmed_by','schedule_revision']);
  changed := changed or (new.status in ('cancelled','rejected') and new.status is distinct from old.status);
 else
  changed := (to_jsonb(new) - array['updated_at','photographer_confirmed_at','photographer_confirmed_by','schedule_revision'])
    is distinct from (to_jsonb(old) - array['updated_at','photographer_confirmed_at','photographer_confirmed_by','schedule_revision']);
 end if;
 if changed then
  new.photographer_confirmed_at:=null;new.photographer_confirmed_by:=null;new.schedule_revision:=old.schedule_revision+1;
 end if;
 return new;
end;$$;
drop trigger if exists reset_photographer_confirmation on public.bookings;
create trigger reset_photographer_confirmation before update on public.bookings for each row execute function public.reset_photographer_confirmation();
drop trigger if exists reset_photographer_confirmation on public.calendar_events;
create trigger reset_photographer_confirmation before update on public.calendar_events for each row execute function public.reset_photographer_confirmation();

create or replace function public.photographer_confirm_schedule(p_kind text,p_id uuid,p_revision integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_name text; v_time timestamptz;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 select p.name into v_name from public.photographer_accounts a join public.photographers p on p.id=a.photographer_id
 where a.user_id=auth.uid() and p.active=true;
 if v_name is null then raise exception 'PHOTOGRAPHER_NOT_LINKED'; end if;
 if p_kind='booking' then
  update public.bookings set photographer_confirmed_at=coalesce(photographer_confirmed_at,now()),photographer_confirmed_by=auth.uid()
  where id=p_id and photographer=v_name and schedule_revision=p_revision and status not in ('cancelled','rejected','completed')
  returning photographer_confirmed_at into v_time;
 elsif p_kind='manual' then
  update public.calendar_events set photographer_confirmed_at=coalesce(photographer_confirmed_at,now()),photographer_confirmed_by=auth.uid()
  where id=p_id and photographer=v_name and schedule_revision=p_revision
  returning photographer_confirmed_at into v_time;
 else raise exception 'INVALID_KIND'; end if;
 if v_time is null then raise exception 'SCHEDULE_CHANGED_OR_NOT_ALLOWED'; end if;
 return jsonb_build_object('confirmed_at',v_time);
end;$$;
revoke all on function public.photographer_confirm_schedule(text,uuid,integer) from public,anon;
grant execute on function public.photographer_confirm_schedule(text,uuid,integer) to authenticated;

create or replace function public.admin_photographer_account(p_photographer_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
 select jsonb_build_object('user_id',a.user_id,'email',u.email) into result
 from public.photographer_accounts a join auth.users u on u.id=a.user_id where a.photographer_id=p_photographer_id;
 return result;
end;$$;
revoke all on function public.admin_photographer_account(uuid) from public,anon;
grant execute on function public.admin_photographer_account(uuid) to authenticated;

create or replace function public.photographer_my_schedule(p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_member record; v_items jsonb;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 93 then
   raise exception 'INVALID_DATE_RANGE';
 end if;
 select p.id,p.name,p.team into v_member
 from public.photographer_accounts a join public.photographers p on p.id=a.photographer_id
 where a.user_id=auth.uid() and p.active=true;
 if not found then raise exception 'PHOTOGRAPHER_NOT_LINKED'; end if;
 select coalesce(jsonb_agg(x.item order by x.event_date,x.item->>'id'),'[]'::jsonb) into v_items
 from (
  select b.shoot_date as event_date,jsonb_build_object(
   'id','booking:'||b.id::text,'kind','booking','date',b.shoot_date,'slot',b.time_slot,
   'title',b.customer_name,'code',b.booking_code,'status',b.status,
   'confirmed_at',b.photographer_confirmed_at,'revision',b.schedule_revision,
   'school',b.school,'class_name',b.class_name,'group_size',b.group_size,
   'package_name',b.package_name,'phone',b.phone,'note',b.note
  ) as item from public.bookings b
  where b.photographer=v_member.name and b.shoot_date between p_from and p_to
  union all
  select e.event_date,jsonb_build_object(
   'id','event:'||e.id::text,'kind','manual','date',e.event_date,'slot',e.time_slot,
   'title',e.title,'status','manual','note',e.note,'blocks_booking',e.blocks_booking,
   'confirmed_at',e.photographer_confirmed_at,'revision',e.schedule_revision
  ) from public.calendar_events e
  where e.photographer=v_member.name and e.event_date between p_from and p_to
  union all
  select b.block_date,jsonb_build_object(
   'id','block:'||b.id::text,'kind','block','date',b.block_date,'slot',b.time_slot,
   'title','Khung giờ không nhận lịch','status','blocked'
  ) from public.photographer_blocks b
  where b.photographer=v_member.name and b.block_date between p_from and p_to
 ) x;
 return jsonb_build_object('member',jsonb_build_object('id',v_member.id,'name',v_member.name,'team',v_member.team),'items',v_items);
end;
$$;
revoke all on function public.photographer_my_schedule(date,date) from public, anon;
grant execute on function public.photographer_my_schedule(date,date) to authenticated;
commit;
