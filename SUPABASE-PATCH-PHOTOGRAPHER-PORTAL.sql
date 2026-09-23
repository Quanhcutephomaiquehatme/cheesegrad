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
   'school',b.school,'class_name',b.class_name,'group_size',b.group_size,
   'package_name',b.package_name,'phone',b.phone,'note',b.note
  ) as item from public.bookings b
  where b.photographer=v_member.name and b.shoot_date between p_from and p_to
  union all
  select e.event_date,jsonb_build_object(
   'id','event:'||e.id::text,'kind','manual','date',e.event_date,'slot',e.time_slot,
   'title',e.title,'status','manual','note',e.note,'blocks_booking',e.blocks_booking
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
