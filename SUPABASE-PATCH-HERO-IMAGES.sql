-- CHEESE.GRADUATION — PATCH ẢNH CHẠY ĐẦU TRANG
-- Chạy toàn bộ file này 1 lần trong Supabase -> SQL Editor.

create table if not exists public.site_hero_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text,
  alt_text text not null default 'Ảnh tốt nghiệp Cheese.Graduation',
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_hero_images_sort_idx on public.site_hero_images(sort_order, created_at);

alter table public.site_hero_images enable row level security;

drop policy if exists "public_read_site_hero_images" on public.site_hero_images;
create policy "public_read_site_hero_images" on public.site_hero_images for select to anon, authenticated using (active = true or public.is_admin());

drop policy if exists "admin_manage_site_hero_images" on public.site_hero_images;
create policy "admin_manage_site_hero_images" on public.site_hero_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.site_hero_images to anon, authenticated;
grant insert, update, delete on public.site_hero_images to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media','site-media',true,15728640,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=true, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "public_read_site_media" on storage.objects;
create policy "public_read_site_media" on storage.objects for select to public using (bucket_id='site-media');

drop policy if exists "admin_insert_site_media" on storage.objects;
create policy "admin_insert_site_media" on storage.objects for insert to authenticated with check (bucket_id='site-media' and public.is_admin());

drop policy if exists "admin_update_site_media" on storage.objects;
create policy "admin_update_site_media" on storage.objects for update to authenticated using (bucket_id='site-media' and public.is_admin()) with check (bucket_id='site-media' and public.is_admin());

drop policy if exists "admin_delete_site_media" on storage.objects;
create policy "admin_delete_site_media" on storage.objects for delete to authenticated using (bucket_id='site-media' and public.is_admin());

insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-01.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 1', 10, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-01.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-02.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 2', 20, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-02.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-03.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 3', 30, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-03.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-04.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 4', 40, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-04.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-05.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 5', 50, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-05.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-06.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 6', 60, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-06.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-07.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 7', 70, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-07.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-08.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 8', 80, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-08.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-09.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 9', 90, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-09.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-10.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 10', 100, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-10.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-11.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 11', 110, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-11.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-12.png', 'Ảnh tốt nghiệp Cheese.Graduation 12', 120, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-12.png');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-13.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 13', 130, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-13.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/home/photo-14.jpg', 'Ảnh tốt nghiệp Cheese.Graduation 14', 140, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/home/photo-14.jpg');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-01.webp', 'Ảnh tốt nghiệp Cheese.Graduation 15', 150, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-01.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-02.webp', 'Ảnh tốt nghiệp Cheese.Graduation 16', 160, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-02.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-03.webp', 'Ảnh tốt nghiệp Cheese.Graduation 17', 170, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-03.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-04.webp', 'Ảnh tốt nghiệp Cheese.Graduation 18', 180, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-04.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-05.webp', 'Ảnh tốt nghiệp Cheese.Graduation 19', 190, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-05.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-06.webp', 'Ảnh tốt nghiệp Cheese.Graduation 20', 200, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-06.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-07.webp', 'Ảnh tốt nghiệp Cheese.Graduation 21', 210, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-07.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-08.webp', 'Ảnh tốt nghiệp Cheese.Graduation 22', 220, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-08.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-09.webp', 'Ảnh tốt nghiệp Cheese.Graduation 23', 230, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-09.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-10.webp', 'Ảnh tốt nghiệp Cheese.Graduation 24', 240, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-10.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-11.webp', 'Ảnh tốt nghiệp Cheese.Graduation 25', 250, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-11.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-12.webp', 'Ảnh tốt nghiệp Cheese.Graduation 26', 260, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-12.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-13.webp', 'Ảnh tốt nghiệp Cheese.Graduation 27', 270, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-13.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-14.webp', 'Ảnh tốt nghiệp Cheese.Graduation 28', 280, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-14.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-15.webp', 'Ảnh tốt nghiệp Cheese.Graduation 29', 290, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-15.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-16.webp', 'Ảnh tốt nghiệp Cheese.Graduation 30', 300, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-16.webp');
insert into public.site_hero_images (image_url, alt_text, sort_order, active) select 'assets/images/hero/hero-17.webp', 'Ảnh tốt nghiệp Cheese.Graduation 31', 310, true where not exists (select 1 from public.site_hero_images where image_url='assets/images/hero/hero-17.webp');

notify pgrst, 'reload schema';
