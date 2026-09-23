-- CHEESE.GRADUATION — THƯ VIỆN PRO
-- Chạy toàn bộ file này 1 lần trong Supabase -> SQL Editor.
-- An toàn khi chạy lại.

create table if not exists public.site_library_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  thumbnail_url text,
  storage_path text,
  thumbnail_path text,
  alt_text text not null default 'Ảnh Cheese.Graduation',
  width integer,
  height integer,
  full_bytes bigint,
  thumbnail_bytes bigint,
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_library_images add column if not exists thumbnail_url text;
alter table public.site_library_images add column if not exists thumbnail_path text;
alter table public.site_library_images add column if not exists width integer;
alter table public.site_library_images add column if not exists height integer;
alter table public.site_library_images add column if not exists full_bytes bigint;
alter table public.site_library_images add column if not exists thumbnail_bytes bigint;

create unique index if not exists site_library_images_url_uidx on public.site_library_images(image_url);
create index if not exists site_library_images_sort_idx on public.site_library_images(sort_order,created_at);

alter table public.site_library_images enable row level security;
drop policy if exists "public_read_site_library_images" on public.site_library_images;
create policy "public_read_site_library_images" on public.site_library_images for select to anon,authenticated using (active=true or public.is_admin());
drop policy if exists "admin_manage_site_library_images" on public.site_library_images;
create policy "admin_manage_site_library_images" on public.site_library_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.site_library_images to anon,authenticated;
grant insert,update,delete on public.site_library_images to authenticated;

-- Đảm bảo bảng Real Work tồn tại và biết ảnh nào được đưa từ Thư viện.
create table if not exists public.site_real_work_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text,
  alt_text text not null default 'Real Work · Cheese.Graduation',
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_real_work_images add column if not exists source_library_id uuid;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='site_real_work_images_source_library_id_fkey' and conrelid='public.site_real_work_images'::regclass) then
    alter table public.site_real_work_images add constraint site_real_work_images_source_library_id_fkey foreign key (source_library_id) references public.site_library_images(id) on delete set null;
  end if;
end $$;
create unique index if not exists site_real_work_source_library_uidx on public.site_real_work_images(source_library_id) where source_library_id is not null;

alter table public.site_real_work_images enable row level security;
drop policy if exists "public_read_site_real_work_images" on public.site_real_work_images;
create policy "public_read_site_real_work_images" on public.site_real_work_images for select to anon,authenticated using (active=true or public.is_admin());
drop policy if exists "admin_manage_site_real_work_images" on public.site_real_work_images;
create policy "admin_manage_site_real_work_images" on public.site_real_work_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.site_real_work_images to anon,authenticated;
grant insert,update,delete on public.site_real_work_images to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('site-media','site-media',true,15728640,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "public_read_site_media" on storage.objects;
create policy "public_read_site_media" on storage.objects for select to public using (bucket_id='site-media');
drop policy if exists "admin_insert_site_media" on storage.objects;
create policy "admin_insert_site_media" on storage.objects for insert to authenticated with check (bucket_id='site-media' and public.is_admin());
drop policy if exists "admin_update_site_media" on storage.objects;
create policy "admin_update_site_media" on storage.objects for update to authenticated using (bucket_id='site-media' and public.is_admin()) with check (bucket_id='site-media' and public.is_admin());
drop policy if exists "admin_delete_site_media" on storage.objects;
create policy "admin_delete_site_media" on storage.objects for delete to authenticated using (bucket_id='site-media' and public.is_admin());

-- Nếu đã có dữ liệu cũ, thumbnail tạm dùng ảnh full cho tới khi ảnh được upload lại.
update public.site_library_images set thumbnail_url=image_url where thumbnail_url is null;

-- 10 ảnh mẫu hiện tại.
insert into public.site_library_images (image_url,thumbnail_url,alt_text,sort_order,active,width,height,full_bytes,thumbnail_bytes)
select 'assets/images/real-work/real-work-01.webp','assets/images/library-thumbs/real-work-01.webp','NEU · Hoa và lễ phục',10,true,1365,2048,138268,34464
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-01.webp');
update public.site_library_images set thumbnail_url=coalesce(thumbnail_url,'assets/images/library-thumbs/real-work-01.webp'),width=coalesce(width,1365),height=coalesce(height,2048),full_bytes=coalesce(full_bytes,138268),thumbnail_bytes=coalesce(thumbnail_bytes,34464) where image_url='assets/images/real-work/real-work-01.webp';
insert into public.site_library_images (image_url,thumbnail_url,alt_text,sort_order,active,width,height,full_bytes,thumbnail_bytes)
select 'assets/images/real-work/real-work-03.webp','assets/images/library-thumbs/real-work-03.webp','NEU · Kiến trúc biểu tượng',20,true,1365,2048,403600,39780
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-03.webp');
update public.site_library_images set thumbnail_url=coalesce(thumbnail_url,'assets/images/library-thumbs/real-work-03.webp'),width=coalesce(width,1365),height=coalesce(height,2048),full_bytes=coalesce(full_bytes,403600),thumbnail_bytes=coalesce(thumbnail_bytes,39780) where image_url='assets/images/real-work/real-work-03.webp';
insert into public.site_library_images (image_url,thumbnail_url,alt_text,sort_order,active,width,height,full_bytes,thumbnail_bytes)
select 'assets/images/real-work/real-work-11.webp','assets/images/library-thumbs/real-work-11.webp','Nụ cười giữa khuôn viên',30,true,1365,2048,100206,26072
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-11.webp');
update public.site_library_images set thumbnail_url=coalesce(thumbnail_url,'assets/images/library-thumbs/real-work-11.webp'),width=coalesce(width,1365),height=coalesce(height,2048),full_bytes=coalesce(full_bytes,100206),thumbnail_bytes=coalesce(thumbnail_bytes,26072) where image_url='assets/images/real-work/real-work-11.webp';
insert into public.site_library_images (image_url,thumbnail_url,alt_text,sort_order,active,width,height,full_bytes,thumbnail_bytes)
select 'assets/images/real-work/real-work-05.webp','assets/images/library-thumbs/real-work-05.webp','NEU · Khoảnh khắc trong hội trường',40,true,1376,2048,200160,38232
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-05.webp');
update public.site_library_images set thumbnail_url=coalesce(thumbnail_url,'assets/images/library-thumbs/real-work-05.webp'),width=coalesce(width,1376),height=coalesce(height,2048),full_bytes=coalesce(full_bytes,200160),thumbnail_bytes=coalesce(thumbnail_bytes,38232) where image_url='assets/images/real-work/real-work-05.webp';
insert into public.site_library_images (image_url,thumbnail_url,alt_text,sort_order,active,width,height,full_bytes,thumbnail_bytes)
select 'assets/images/real-work/real-work-06.webp','assets/images/library-thumbs/real-work-06.webp','FTU · Nắng chiều',50,true,1365,2048,87238,21908
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-06.webp');
update public.site_library_images set thumbnail_url=coalesce(thumbnail_url,'assets/images/library-thumbs/real-work-06.webp'),width=coalesce(width,1365),height=coalesce(height,2048),full_bytes=coalesce(full_bytes,87238),thumbnail_bytes=coalesce(thumbnail_bytes,21908) where image_url='assets/images/real-work/real-work-06.webp';
insert into public.site_library_images (image_url,thumbnail_url,alt_text,sort_order,active,width,height,full_bytes,thumbnail_bytes)
select 'assets/images/real-work/real-work-10.webp','assets/images/library-thumbs/real-work-10.webp','Kiến trúc đường cong',60,true,1365,2048,133918,39584
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-10.webp');
update public.site_library_images set thumbnail_url=coalesce(thumbnail_url,'assets/images/library-thumbs/real-work-10.webp'),width=coalesce(width,1365),height=coalesce(height,2048),full_bytes=coalesce(full_bytes,133918),thumbnail_bytes=coalesce(thumbnail_bytes,39584) where image_url='assets/images/real-work/real-work-10.webp';
insert into public.site_library_images (image_url,thumbnail_url,alt_text,sort_order,active,width,height,full_bytes,thumbnail_bytes)
select 'assets/images/real-work/real-work-08.webp','assets/images/library-thumbs/real-work-08.webp','FTU · Góc hoa giấy',70,true,1365,2048,402258,87604
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-08.webp');
update public.site_library_images set thumbnail_url=coalesce(thumbnail_url,'assets/images/library-thumbs/real-work-08.webp'),width=coalesce(width,1365),height=coalesce(height,2048),full_bytes=coalesce(full_bytes,402258),thumbnail_bytes=coalesce(thumbnail_bytes,87604) where image_url='assets/images/real-work/real-work-08.webp';
insert into public.site_library_images (image_url,thumbnail_url,alt_text,sort_order,active,width,height,full_bytes,thumbnail_bytes)
select 'assets/images/real-work/real-work-16.webp','assets/images/library-thumbs/real-work-16.webp','Khoảnh khắc cùng chim bồ câu',80,true,1285,2047,96238,23842
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-16.webp');
update public.site_library_images set thumbnail_url=coalesce(thumbnail_url,'assets/images/library-thumbs/real-work-16.webp'),width=coalesce(width,1285),height=coalesce(height,2047),full_bytes=coalesce(full_bytes,96238),thumbnail_bytes=coalesce(thumbnail_bytes,23842) where image_url='assets/images/real-work/real-work-16.webp';
insert into public.site_library_images (image_url,thumbnail_url,alt_text,sort_order,active,width,height,full_bytes,thumbnail_bytes)
select 'assets/images/real-work/real-work-13.webp','assets/images/library-thumbs/real-work-13.webp','Nét cổ điển ngày tốt nghiệp',90,true,1365,2048,158828,38144
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-13.webp');
update public.site_library_images set thumbnail_url=coalesce(thumbnail_url,'assets/images/library-thumbs/real-work-13.webp'),width=coalesce(width,1365),height=coalesce(height,2048),full_bytes=coalesce(full_bytes,158828),thumbnail_bytes=coalesce(thumbnail_bytes,38144) where image_url='assets/images/real-work/real-work-13.webp';
insert into public.site_library_images (image_url,thumbnail_url,alt_text,sort_order,active,width,height,full_bytes,thumbnail_bytes)
select 'assets/images/real-work/real-work-18.webp','assets/images/library-thumbs/real-work-18.webp','Toàn cảnh trong khuôn viên',100,true,1365,2048,324402,81874
where not exists (select 1 from public.site_library_images where image_url='assets/images/real-work/real-work-18.webp');
update public.site_library_images set thumbnail_url=coalesce(thumbnail_url,'assets/images/library-thumbs/real-work-18.webp'),width=coalesce(width,1365),height=coalesce(height,2048),full_bytes=coalesce(full_bytes,324402),thumbnail_bytes=coalesce(thumbnail_bytes,81874) where image_url='assets/images/real-work/real-work-18.webp';

notify pgrst, 'reload schema';
