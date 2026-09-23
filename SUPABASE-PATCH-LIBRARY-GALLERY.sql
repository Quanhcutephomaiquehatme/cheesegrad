-- CHEESE.GRADUATION — THƯ VIỆN ẢNH
-- Chạy toàn bộ file này 1 lần trong Supabase -> SQL Editor.

create table if not exists public.site_library_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text,
  alt_text text not null default 'Ảnh Cheese.Graduation',
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists site_library_images_url_uidx
on public.site_library_images(image_url);

create index if not exists site_library_images_sort_idx
on public.site_library_images(sort_order,created_at);

alter table public.site_library_images enable row level security;

drop policy if exists "public_read_site_library_images" on public.site_library_images;
create policy "public_read_site_library_images"
on public.site_library_images for select
to anon, authenticated
using (active=true or public.is_admin());

drop policy if exists "admin_manage_site_library_images" on public.site_library_images;
create policy "admin_manage_site_library_images"
on public.site_library_images for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.site_library_images to anon, authenticated;
grant insert,update,delete on public.site_library_images to authenticated;

-- Dùng chung bucket site-media đã có từ mục Ảnh giao diện.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('site-media','site-media',true,15728640,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set
  public=true,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "public_read_site_media" on storage.objects;
create policy "public_read_site_media"
on storage.objects for select to public
using (bucket_id='site-media');

drop policy if exists "admin_insert_site_media" on storage.objects;
create policy "admin_insert_site_media"
on storage.objects for insert to authenticated
with check (bucket_id='site-media' and public.is_admin());

drop policy if exists "admin_update_site_media" on storage.objects;
create policy "admin_update_site_media"
on storage.objects for update to authenticated
using (bucket_id='site-media' and public.is_admin())
with check (bucket_id='site-media' and public.is_admin());

drop policy if exists "admin_delete_site_media" on storage.objects;
create policy "admin_delete_site_media"
on storage.objects for delete to authenticated
using (bucket_id='site-media' and public.is_admin());

-- Khởi tạo thư viện bằng 10 ảnh Real Work hiện tại.
insert into public.site_library_images (image_url,alt_text,sort_order,active)
select 'assets/images/real-work/real-work-01.webp', 'NEU · Hoa và lễ phục', 10, true
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-01.webp');
insert into public.site_library_images (image_url,alt_text,sort_order,active)
select 'assets/images/real-work/real-work-03.webp', 'NEU · Kiến trúc biểu tượng', 20, true
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-03.webp');
insert into public.site_library_images (image_url,alt_text,sort_order,active)
select 'assets/images/real-work/real-work-11.webp', 'Nụ cười giữa khuôn viên', 30, true
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-11.webp');
insert into public.site_library_images (image_url,alt_text,sort_order,active)
select 'assets/images/real-work/real-work-05.webp', 'NEU · Khoảnh khắc trong hội trường', 40, true
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-05.webp');
insert into public.site_library_images (image_url,alt_text,sort_order,active)
select 'assets/images/real-work/real-work-06.webp', 'FTU · Nắng chiều', 50, true
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-06.webp');
insert into public.site_library_images (image_url,alt_text,sort_order,active)
select 'assets/images/real-work/real-work-10.webp', 'Kiến trúc đường cong', 60, true
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-10.webp');
insert into public.site_library_images (image_url,alt_text,sort_order,active)
select 'assets/images/real-work/real-work-08.webp', 'FTU · Góc hoa giấy', 70, true
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-08.webp');
insert into public.site_library_images (image_url,alt_text,sort_order,active)
select 'assets/images/real-work/real-work-16.webp', 'Khoảnh khắc cùng chim bồ câu', 80, true
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-16.webp');
insert into public.site_library_images (image_url,alt_text,sort_order,active)
select 'assets/images/real-work/real-work-13.webp', 'Nét cổ điển ngày tốt nghiệp', 90, true
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-13.webp');
insert into public.site_library_images (image_url,alt_text,sort_order,active)
select 'assets/images/real-work/real-work-18.webp', 'Toàn cảnh trong khuôn viên', 100, true
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-18.webp');

notify pgrst, 'reload schema';
