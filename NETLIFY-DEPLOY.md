# Cheese.Graduation — Deploy Netlify

## Trước khi upload
1. Mở `config.js` ở thư mục gốc.
2. Dán `Project URL` và `Publishable Key` của Supabase.
3. Không dán `service_role` hoặc Secret key.

## Upload
- Giải nén ZIP.
- Kéo **nguyên thư mục đã giải nén** vào Netlify Drop.
- `index.html` đã nằm ở thư mục gốc, không cần Build command.

## Các URL sau khi deploy
- Trang chính: `/`
- Admin: `/admin.html`
- Đặt lịch: `/lien-he.html`

## Cấu trúc chính
- `assets/css/index/` — CSS trang chính, hồ sơ thợ, booking/polish.
- `assets/css/admin/` — CSS Admin.
- `assets/css/booking/` — CSS trang đặt lịch.
- `assets/js/index/` — JS trang chính và hồ sơ thợ.
- `assets/js/admin/` — JS Admin.
- `assets/js/booking/` — JS đặt lịch.
- `assets/js/shared/` — JS dùng chung.
- `assets/images/home/` — ảnh đã tách khỏi base64 trong HTML.
- `assets/photographers/` — ảnh mặc định photographer.
- `assets/audio/` — nhạc nền.

Bản này là static site; Netlify không cần `npm install` hoặc framework build.
