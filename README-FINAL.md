# Cheese.Graduation — COMPLETE FINAL

Bộ file hoàn chỉnh, đã gộp các thay đổi mới nhất.

## Trang chính
- `index.html`

## Đặt lịch
- `lien-he.html`
- `contact-booking.js`
- `booking-prices.js`
- Kỷ yếu và Tốt nghiệp đại học là hai mục riêng.
- Phần Tốt nghiệp đại học dùng giao diện gói riêng.
- 4 bước đặt lịch đã căn lại dạng timeline.
- Tỉnh di chuyển giới hạn miền Bắc + miền Trung.

## Admin
- `admin.html`
- `cheese-admin.js`
- Quản lý lịch chụp và photographer.

## Supabase
- `supabase-setup.sql`
- thư mục `supabase/functions/`

## Media
- `assets/audio/cheese-background.m4a`
- `assets/photographers/`

## Cấu hình
- `config.js` — Supabase URL + anon/publishable key
- `studio-contact.js` — Instagram/Messenger
- `drive-links.js` — link Drive tham khảo

Chạy lại `supabase-setup.sql` nếu project Supabase của bạn chưa có các thay đổi mới nhất.


## Music Fix v3

- Khôi phục vị trí nhạc trước khi bắt đầu phát ở trang mới.
- Không còn timeupdate ghi đè vị trí cũ thành 0:00 lúc load.
- Giữ thời gian bằng localStorage và window.name dự phòng khi test local.
- Mỗi tab mới mặc định bật nhạc.
- Nếu browser chặn autoplay có tiếng, audio chạy warm-up ở chế độ mute và bật tiếng ngay ở tương tác đầu tiên.


## Quản lý giá và dịch vụ theo từng thợ

Admin Photographer giờ là nguồn dữ liệu cho giá Kỷ yếu, giá Tốt nghiệp đại học và Dịch vụ đi kèm. Sau khi sửa và lưu, trang đặt lịch / hồ sơ thợ sẽ đọc dữ liệu mới từ Supabase.


## Cập nhật hồ sơ photographer dạng ảnh mẫu

- Đầu trang hồ sơ hiển thị breadcrumb `Chọn thợ / Tên thợ`.
- Chỉ hiển thị tối đa 5 ảnh ở slider đầu trang.
- Dưới slider có dòng hướng dẫn vuốt để xem các ảnh còn lại.
- Ngay dưới ảnh có nút xanh mở album Google Drive của photographer.
- Thông tin thợ được rút gọn: tên + ekip, Hà Nội + rating + số buổi chụp, mô tả và tag.
- Link Drive hiện tại dùng link album chung đã cấu hình trong `drive-links.js`.


## Photographer CMS mới
Trong Admin, mục Photographer giờ điều khiển trực tiếp toàn bộ thông tin khách nhìn thấy trên hồ sơ thợ, gồm đúng 5 ảnh đầu, thông tin cá nhân, giá, dịch vụ và Google Drive.


# Quản lý 5 ảnh từng photographer

Admin → Photographer giờ có 5 ô ảnh riêng cho từng thợ.

- Ảnh 1: ảnh chính và ảnh card ở trang chủ.
- Ảnh 2–5: ảnh vuốt trong hồ sơ thợ.
- Mỗi ô có thể chọn ảnh từ máy hoặc dán URL.
- Có thể xóa ảnh và dùng mũi tên trái/phải để đổi thứ tự.
- Ảnh chọn từ máy chỉ upload khi bấm **Lưu thay đổi**.
- Dữ liệu vẫn lưu trong `cover_url` + `gallery_urls`, nên không cần đổi cấu trúc database.


## Cấu trúc deploy gọn cho Netlify

Bản này đã tách file lớn thành cấu trúc static rõ ràng:

```text
index.html
admin.html
lien-he.html
config.js                    # chỉ chứa Project URL + Publishable Key
assets/
  css/                       # CSS từng trang
  js/
    shared/                  # script dùng chung
    index/                   # script trang chính / hồ sơ thợ
    admin/                   # script Admin
    booking/                 # script đặt lịch
  images/home/               # ảnh trước đây nhúng base64 trong index.html
  photographers/             # ảnh mặc định các thợ
  audio/                     # nhạc nền
supabase/                    # Edge Functions/config
supabase-setup.sql
```

`config.js` cố ý để ở thư mục gốc để bạn dễ dán Supabase Project URL và Publishable Key. Không đưa `service_role`/Secret key vào file này.

Khi deploy Netlify, kéo **nguyên thư mục** này lên. Không kéo riêng `index.html`.


## Fix upload ảnh Photographer
Admin tự tối ưu ảnh lớn trước khi upload lên Supabase Storage. Ảnh lớn được resize tối đa khoảng 2800 px cạnh dài và chuyển sang WEBP chất lượng cao. Điều này tránh lỗi `The object exceeded the maximum allowed size` với bucket `photographers` đang giới hạn 15 MB/ảnh.

Nếu Supabase vẫn báo giới hạn dung lượng, vào Storage → bucket `photographers` → Edit bucket và kiểm tra File size limit. Bản code này chủ động giữ ảnh upload ở mức thấp hơn nhiều so với giới hạn 15 MB.


## Khung ảnh hồ sơ 4:6
5 ảnh đầu trong hồ sơ photographer được hiển thị theo khung dọc 4:6 (CSS `aspect-ratio: 2 / 3`) trên cả desktop và mobile. Ảnh dùng `object-fit: cover` để phủ kín khung.


## Trang bảng giá
- Trang mới: `bang-gia.html`
- Nút “Xem ảnh thật” ở trang chính đã đổi thành `Bảng giá & phụ phí tỉnh`.
- Danh sách phụ phí tỉnh đã cập nhật theo bảng mới (22 địa điểm).


## Admin đồng bộ Bảng giá & Phụ phí
Admin có thêm mục `Bảng giá & phụ phí`. Tại đây có thể sửa:
- Giá tham khảo đầu trang (mặc định 1.500.000đ)
- Tên hạng ekip, giá từ, mô tả, ekip liên kết
- Tất cả tên tỉnh/khu vực, nhóm vùng, phụ phí / 1 thợ và ghi chú

Dữ liệu được lưu ở bảng Supabase `site_pricing` và được dùng chung bởi `bang-gia.html` + `lien-he.html`.
Cần chạy lại `supabase-setup.sql` một lần để tạo bảng `site_pricing` và RLS.


## Admin Take Care
Admin có thêm mục `Take Care` để quản lý nhân sự và chấm lịch làm.

Chi phí nội bộ mặc định:
- Cả ngày: 400.000đ / người / ngày
- Nửa ngày sáng hoặc chiều: 250.000đ / người / nửa ngày

Mỗi Take Care chỉ có một loại ca cho một ngày. Nếu làm cả sáng và chiều, chọn `Cả ngày` để hệ thống tính 400.000đ thay vì hai nửa ngày.

Admin hiển thị tổng số ca, số ngày cả ngày, số ca nửa ngày, tổng chi phí theo tháng, tổng từng người và danh sách ngày đã làm.

Cần chạy lại `supabase-setup.sql` một lần để tạo hai bảng `takecare_staff` và `takecare_shifts` cùng RLS.


## FIX site_pricing + giá công Take Care chỉnh được
Nếu Admin báo `Could not find the table 'public.site_pricing' in the schema cache`, chạy file `SUPABASE-PATCH-PRICING-TAKECARE.sql` một lần trong Supabase SQL Editor.

Admin → Take Care giờ cho chỉnh:
- Công cả ngày (mặc định 400.000đ)
- Công nửa ngày (mặc định 250.000đ)

Lịch Take Care mới dùng mức giá đang lưu. Lịch cũ giữ nguyên `cost_amount`, nên thay đổi giá về sau không làm thay đổi chi phí lịch sử.


## Ảnh chạy đầu trang — Admin CMS
- Bộ ảnh người dùng gửi đã được thêm vào `assets/images/hero/` và chạy cùng các ảnh đầu trang cũ.
- Admin có mục `Ảnh đầu trang`: upload nhiều ảnh, thêm URL, mô tả, ẩn/hiện, đổi thứ tự và xóa.
- Ảnh upload được tự tối ưu WEBP trước khi đưa lên Supabase Storage bucket `site-media`.
- Chạy `SUPABASE-PATCH-HERO-IMAGES.sql` một lần trên project Supabase hiện tại để tạo bảng `site_hero_images`, bucket và seed các ảnh mặc định.


## Instagram link
Các nút Instagram hiện mở trực tiếp `https://www.instagram.com/cheese.graphy/`. Muốn đổi tài khoản, sửa `instagramUsername` và `instagramUrl` trong `assets/js/shared/studio-contact.js`.


## Sửa / xóa lịch tự thêm trong Admin
Trong `Admin → Lịch chụp`, lịch tự thêm giờ có nút **Sửa lịch** và **Xóa** ngay ở chi tiết ngày. Bên dưới lịch tháng có thêm bảng **Lịch tự thêm trong tháng** để quản lý toàn bộ lịch. Khi sửa có thể đổi ngày, ca, photographer, tiêu đề, nguồn, ghi chú và trạng thái chặn booking. Không cần thêm bảng SQL mới vì tiếp tục dùng `calendar_events`.


## Admin: Lịch sắp tới + Tổng quan tháng/năm
- Mục `Đơn đặt lịch` đã đổi thành `Lịch sắp tới`.
- Lịch sắp tới gồm booking khách và lịch Admin tự thêm, xếp theo từng ngày có lịch từ gần đến xa.
- Bấm một lịch khách để mở thông tin chi tiết; bấm lịch Admin để sửa lịch.
- Trong `Lịch chụp`, bấm vào ngày sẽ hiện chi tiết tất cả lịch của ngày đó.
- Tổng quan hiển thị số lịch trong tháng, số lịch trong năm, doanh thu ghi nhận trong tháng và trong năm.
- Doanh thu hiện được tính từ `deposit_amount` của booking có trạng thái cọc `partial` hoặc `paid`, theo ngày chụp.
- Đã gỡ luồng Telegram / Resend Email / Zalo khỏi Admin và luồng booking. Thông báo realtime trong trình duyệt của Admin vẫn hoạt động.


## Sửa lịch / Xóa lịch — đã áp dụng cho mọi loại lịch
- Booking khách: có nút `Sửa lịch` và `Xóa lịch` ở Lịch sắp tới và chi tiết ngày.
- Khi sửa booking có thể đổi ngày, ca, photographer, khách, SĐT, trường/nhóm, gói, số lượng, ghi chú, trạng thái và số tiền đã ghi nhận.
- Lịch Admin tự thêm: có nút `Sửa lịch` / `Xóa lịch` ở Lịch sắp tới, chi tiết ngày và danh sách lịch tự thêm trong tháng.
- Xóa có hộp xác nhận trước khi thực hiện.


## Photographer: Thợ đối tác / Thợ thường
Trong `Admin → Photographer`, mỗi photographer có thêm trường:
- `Thợ đối tác`: STU hưởng 15%, photographer hưởng 85%.
- `Thợ thường`: STU hưởng 20%, photographer hưởng 80%.

Các photographer hiện có mặc định là `Thợ thường` cho tới khi Admin đổi lại.

## Admin → Dòng tiền
Trang Dòng tiền quản lý theo từng booking:
- Doanh thu thực tế buổi chụp.
- Khách đã thanh toán cho STU.
- Chi phí Take Care.
- Chi phí di chuyển.
- Chi phí hậu kỳ / in ấn.
- Chi phí khác + ghi chú.
- Phần STU theo 15% / 20%.
- Phần photographer theo 85% / 80%.
- Số tiền đã chuyển photographer.
- Còn phải thu khách.
- Còn phải trả photographer.
- Tiền STU đang giữ = khách đã trả − đã trả photographer − tổng chi phí.
- Phần STU sau chi phí = hoa hồng STU − tổng chi phí.

Tỷ lệ photographer được lưu snapshot trong từng dòng tiền khi bấm Lưu, giúp giữ lịch sử của buổi chụp. Khi sửa lại dòng tiền, tỷ lệ sẽ cập nhật theo loại photographer hiện tại.

Cần chạy `SUPABASE-PATCH-FINANCE.sql` một lần trên Supabase hiện tại.


## Founder · STU 0%
Hệ thống hiện có 3 loại photographer:
- `Founder`: STU 0%, Founder nhận 100% doanh thu buổi chụp.
- `Thợ đối tác`: STU 15%, photographer nhận 85%.
- `Thợ thường`: STU 20%, photographer nhận 80%.

Khi chạy `SUPABASE-PATCH-FOUNDER-0-PERCENT.sql`, photographer có `team = Founder` hiện tại sẽ tự chuyển sang loại `Founder`.

Các chi phí Take Care / di chuyển / hậu kỳ / chi phí khác vẫn được theo dõi riêng. Vì Founder có hoa hồng STU = 0%, nếu STU chịu chi phí cho buổi Founder thì ô `STU sau chi phí` có thể âm đúng bằng phần chi phí STU đã chi.


## Mobile Optimized
Bản này tối ưu riêng cho điện thoại:
- Header / menu / CTA dễ bấm hơn.
- Trang chủ dùng 1 card photographer mỗi hàng trên điện thoại, filter vuốt ngang, hero gọn hơn.
- Trang đặt lịch dùng font input 16px để tránh iPhone tự zoom; nút, tab, gói chụp và popup photographer được tối ưu cho ngón tay.
- Bảng giá chuyển thành layout 1 cột, CTA full-width.
- Admin có menu mobile lớn hơn, form dễ nhập, modal chuyển thành bottom-sheet / full-screen phù hợp điện thoại.
- Lịch tháng co vừa màn hình 7 cột; bấm ngày sẽ hiện chi tiết lịch trên mobile (không còn bị ẩn).
- Bảng Take Care và Dòng tiền chuyển thành từng card trên điện thoại, không phải kéo ngang bảng 1000–1450px.
- Hỗ trợ safe-area cho iPhone có tai thỏ / Dynamic Island.


## Real Work — Final curated mobile slider
- Giữ 10 ảnh nổi bật, sắp theo nhịp chân dung / không gian / lễ tốt nghiệp / ánh sáng.
- Desktop: editorial masonry.
- Mobile: vuốt ngang bằng CSS scroll-snap.
- Có bộ đếm `01 / 10` và chỉ báo vị trí.
- Ảnh Real Work không dùng đã được loại khỏi package để deploy nhẹ hơn.


## Real Work — Horizontal Slider Layout
- Toàn bộ phần Real Work đã đổi sang slider ngang trên cả desktop và mobile.
- Có nút điều hướng trái/phải, bộ đếm ảnh và chấm vị trí.
- Bố cục gallery được gọn lại: tiêu đề + mô tả + thanh điều hướng phía trên, dải ảnh cuộn ngang phía dưới.


## Real Work — Autoplay Center Carousel
- Slider tự chạy khoảng 3.6 giây / ảnh.
- 1 ảnh active lớn ở chính giữa; ảnh hai bên thu nhỏ và mờ nhẹ.
- Vuốt, kéo, dùng nút trái/phải, phím mũi tên hoặc chấm vị trí đều được.
- Sau thao tác tay, autoplay tạm dừng khoảng 6.5 giây rồi chạy tiếp.
- Khi tab trình duyệt hoặc section không hiển thị, autoplay tự dừng để tiết kiệm tài nguyên.
- Tôn trọng `prefers-reduced-motion`: người dùng giảm chuyển động sẽ không bị autoplay.


## FIX Real Work + Ảnh giao diện
- Real Work là một dải ảnh ngang dài, tự chạy từng ảnh một.
- Ảnh tới chính giữa được phóng to và rõ nét; ảnh hai bên thu nhỏ, giảm sáng và blur.
- Vuốt/kéo ngang dùng hệ số tăng tốc để đi qua ảnh nhanh hơn, sau đó tự bắt ảnh gần nhất về giữa.
- Slider lặp vô hạn bằng clone ở hai đầu.
- Admin đổi `Ảnh đầu trang` thành `Ảnh giao diện`.
- `Ảnh giao diện` có 3 tab: `Ảnh đầu trang`, `Real Work`, `Ảnh profile`.
- Có thể tự upload, sắp xếp, ẩn/hiện/xóa Real Work.
- Ảnh profile quản lý nhanh 5 vị trí: ảnh bìa + 4 ảnh gallery.
- Mọi ảnh upload từ máy được resize tối đa 2200px và nén WebP mục tiêu khoảng 1.65MB.
- Cần chạy `SUPABASE-PATCH-UI-IMAGES.sql` một lần.


## Real Work Smooth FIX
- Bỏ clone carousel cũ gây nhảy/giật.
- Nút trái/phải dùng index ổn định và luôn hoạt động.
- Mobile dùng native touch scrolling nên vuốt mượt, không bị JavaScript giành thao tác.
- Hiệu ứng scale/blur/opacity được tính theo khoảng cách thật tới tâm màn hình nên chuyển động liên tục, không giật khi đổi active.
- Tiêu đề và cụm điều hướng được căn giữa lại, giảm kích thước heading để tránh lệch/cắt giao diện.
- Autoplay 3.2 giây/ảnh; sau thao tác người dùng sẽ chờ 4.3 giây rồi chạy lại.


## Copy cá nhân / nhóm
- Nội dung hướng khách hàng đã bỏ cách nói “lớp mình / lớp bạn / gói lớp”.
- Thông điệp chuyển sang “của mình”, “cá nhân / nhóm”, “bạn hoặc nhóm của bạn”.
- Field kỹ thuật `class_name` trong database vẫn giữ để tương thích dữ liệu cũ; trên giao diện được hiển thị là `Tên nhóm (nếu có)`.


## Thư viện ảnh + định dạng tiền Admin
- Các ô tiền trong Admin hiển thị dấu chấm hàng nghìn ngay khi nhập, ví dụ `1.500.000`.
- Dữ liệu gửi Supabase vẫn là số nguyên, không lưu dấu chấm.
- Menu trang chủ có mục `Real work` với submenu `Xem thư viện ảnh`.
- Phần Real Work có card `Xem toàn bộ thư viện ảnh`.
- Trang `thu-vien.html` dùng masonry columns, tự giữ tỷ lệ ảnh ngang / dọc như ảnh gốc.
- Admin → Ảnh giao diện có tab `Thư viện ảnh`: upload nhiều ảnh, URL, sửa chú thích, sắp xếp, ẩn/hiện, xóa.
- Ảnh thư viện upload từ máy sử dụng cùng bộ tối ưu WebP (resize tối đa 2200px, mục tiêu khoảng 1.65MB).
- Cần chạy `SUPABASE-PATCH-LIBRARY-GALLERY.sql` một lần.


## Thư viện PRO
- Trang `thu-vien.html` dùng masonry 4 / 3 / 2 cột, ảnh ngang/dọc giữ đúng tỷ lệ.
- Public page tải theo lô 40 ảnh và tự tải thêm khi người xem cuộn gần cuối.
- Upload từ Admin tạo 2 file WebP: thumbnail tối đa 900px ~ mục tiêu 300KB và full tối đa 2200px ~ mục tiêu 1.1MB.
- Database lưu width/height để trình duyệt biết tỷ lệ ảnh trước khi tải, giảm layout shift.
- Lightbox chỉ tải ảnh full khi khách bấm xem lớn.
- Admin Thư viện có nút `Đưa vào Real Work`; hệ thống copy file sang vùng Real Work và chặn đưa trùng cùng một ảnh.
- Các ô tiền trong Admin tiếp tục hiển thị dấu chấm hàng nghìn (`1.500.000`) nhưng lưu Supabase dạng số (`1500000`).
- Cần chạy `SUPABASE-PATCH-LIBRARY-PRO.sql` một lần trên Supabase đang dùng.


## Menu Thư viện riêng + nhạc nền
- `Thư viện ảnh` đã tách khỏi submenu Real Work và trở thành một mục menu riêng trên trang chủ.
- Trang Bảng giá có thêm link `Thư viện ảnh` trong thanh điều hướng và footer.
- Trang `thu-vien.html` và `bang-gia.html` dùng chung `assets/js/shared/music-player.js` với trang chủ.
- Trạng thái bật/tắt và vị trí phát nhạc được giữ xuyên trang bằng localStorage theo logic music-player hiện có.
- Không cần chạy SQL mới cho thay đổi này.


## Hiệu ứng Lightbox thư viện
- Khi xem ảnh lớn, nút trái/phải chuyển ảnh bằng slide + fade + zoom nhẹ.
- Ảnh kế tiếp được preload trước để giảm nháy.
- Mobile hỗ trợ vuốt trái/phải ngay trong ảnh phóng to.
- Có hiệu ứng mở ảnh và tự tắt animation khi thiết bị bật Reduce Motion.
