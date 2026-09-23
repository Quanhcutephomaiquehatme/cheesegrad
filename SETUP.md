# LƯU Ý BẢN HIỆN TẠI

Bản này đã gỡ tích hợp Telegram, Resend Email và Zalo. Các phần hướng dẫn cũ về 3 dịch vụ này ở tài liệu phía dưới không còn được website gọi nữa. Admin vẫn có thông báo realtime trong trình duyệt.

# Cheese.Graduation — Booking + Admin

Bộ file này gồm:

- `index.html` — website đã nâng form đặt lịch.
- `cheese-booking.js` — gửi booking và kiểm tra lịch trống.
- `admin.html` — trang quản trị.
- `cheese-admin.js` — dashboard, calendar, trạng thái, tiền cọc.
- `config.js` — nơi dán Supabase Project URL + anon/publishable key.
- `supabase-setup.sql` — database, RLS, hàm đặt lịch và kiểm tra slot.

## 1. Tạo Supabase

1. Vào Supabase và tạo một project.
2. Mở **SQL Editor**.
3. Copy toàn bộ `supabase-setup.sql` và chạy.
4. Trong file SQL, dòng cuối có:
   `YOUR_ADMIN_EMAIL@example.com`
   Hãy đổi thành email bạn sẽ dùng để đăng nhập admin.

Nếu đã chạy SQL với email mẫu, chạy thêm:

```sql
delete from public.admin_users where email = 'YOUR_ADMIN_EMAIL@example.com';
insert into public.admin_users(email) values ('EMAIL_CUA_BAN');
```

## 2. Tạo tài khoản Admin

Supabase → **Authentication → Users → Add user**.

Tạo user bằng đúng email đã thêm vào `admin_users`.

## 3. Điền config.js

Supabase → **Project Settings / API**.

Dán vào:

```js
window.CHEESE_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_ANON_OR_PUBLISHABLE_KEY"
};
```

Chỉ dùng **anon/publishable key**. Không đưa `service_role` key vào website.

## 4. Upload website

Upload các file sau cùng một thư mục:

- index.html
- admin.html
- config.js
- cheese-booking.js
- cheese-admin.js

Sau đó:

- Khách: `/index.html`
- Quản trị: `/admin.html`

## 5. Luồng hoạt động

Khách gửi form → `submit_booking()` trên Supabase → kiểm tra xung đột lịch → lưu booking → trả mã `CG-...`.

Admin đăng nhập → RLS kiểm tra email có trong `admin_users` → mới đọc/cập nhật được booking.

## Calendar

Trong Admin → **Lịch chụp**:

- Chọn từng photographer.
- Ngày có `Cả ngày` hoặc đủ `Sáng + Chiều` sẽ báo kín.
- Có thể khóa/mở cả ngày.
- Booking hiện màu theo trạng thái tiền cọc.

## Chế độ Demo

Nếu chưa điền Supabase, form website lưu thử vào `localStorage`.
`admin.html` có nút **Xem giao diện demo**.

Demo chỉ để xem giao diện trên cùng trình duyệt, không phải database thật.


## Thông báo booking realtime trong Admin

Bản này đã bật luồng:

`Nút Đặt lịch trên card thợ → Supabase → admin.html → toast + âm báo + calendar`

Khi `admin.html` đang mở và đã đăng nhập:

- Booking mới xuất hiện tự động, không cần F5.
- Có toast ở góc màn hình.
- Có âm báo ngắn.
- Badge ở biểu tượng chuông tăng số lượng.
- Nếu bấm **Bật thông báo** và trình duyệt cho phép, admin còn nhận Browser Notification khi tab ở nền.

`supabase-setup.sql` đã có đoạn thêm `public.bookings` vào `supabase_realtime`.

### Lưu ý quan trọng

Khách **không được dẫn trực tiếp tới `admin.html`**. Đây là chủ ý bảo mật.
Hai trang được “liên kết” qua database Supabase: khách chỉ gửi dữ liệu, còn admin phải đăng nhập mới được đọc booking.

### Khi admin đóng hoàn toàn

Realtime/browser notification chỉ hoạt động khi trang admin hoặc trình duyệt còn chạy.
Nếu cần thông báo ngay cả khi admin đã đóng trình duyệt, hãy nối thêm Email / Telegram / Zalo OA bằng server function hoặc webhook.


# 3 kênh thông báo ngoài hệ thống

Bản này thêm:

1. **Telegram cho admin** — booking mới và khi trạng thái/cọc thay đổi.
2. **Email** — booking mới gửi cho admin; khách nhận email xác nhận và email cập nhật trạng thái nếu họ điền email.
3. **Zalo ZBS Template Message** — gửi xác nhận và trạng thái/cọc tới số điện thoại khách, sau khi OA/ZBS và template đã được duyệt.

## A. Deploy 2 Edge Functions

Cài Supabase CLI, đăng nhập và link project, sau đó từ thư mục project:

```bash
supabase functions deploy booking-notify --no-verify-jwt
supabase functions deploy status-notify
```

`supabase/config.toml` trong bộ file cũng đã đặt `booking-notify` là public và `status-notify` yêu cầu JWT.

## B. Telegram

1. Tạo bot bằng BotFather.
2. Lấy `TELEGRAM_BOT_TOKEN`.
3. Nhắn một tin cho bot / thêm bot vào nhóm.
4. Lấy `TELEGRAM_CHAT_ID`.
5. Thêm cả hai vào **Supabase > Edge Functions > Secrets**.

Booking mới sẽ gửi: mã booking, tên khách, SĐT, ngày, photographer, gói và số lượng.

## C. Email bằng Resend

1. Tạo tài khoản Resend.
2. Xác minh domain gửi mail.
3. Tạo API key.
4. Thêm các secret:

```text
RESEND_API_KEY
EMAIL_FROM
ADMIN_EMAIL
```

Ví dụ `EMAIL_FROM`:

```text
Cheese.Graduation <booking@cheesegraduation.com>
```

Form website đã có thêm trường email khách. Nếu khách điền email, hệ thống gửi xác nhận booking và cập nhật trạng thái/cọc.

## D. Zalo ZBS Template Message

Từ 2026, ZNS được hợp nhất vào **ZBS Template Message**. Bạn cần OA/ZBS phù hợp và template đã được duyệt.

Thêm:

```text
ZALO_ACCESS_TOKEN
ZALO_ZBS_TEMPLATE_BOOKING
ZALO_ZBS_TEMPLATE_STATUS
```

Template booking nên có các biến:

```text
customer_name
booking_code
shoot_date
time_slot
photographer
package_name
```

Template trạng thái nên có:

```text
customer_name
booking_code
booking_status
deposit_status
deposit_amount
shoot_date
time_slot
photographer
```

SĐT khách được tự chuyển từ `09...` sang `849...` trước khi gọi API.

**Lưu ý:** Zalo access token cần được quản lý/refresh theo tài khoản OA của bạn. Không đặt token này trong `index.html` hoặc `config.js`.

## E. Supabase SQL

Chạy lại `supabase-setup.sql`. Bản này:

- thêm `customer_email`,
- thêm bảng `notification_logs`,
- cập nhật `submit_booking()`,
- vẫn giữ RLS,
- vẫn bật Realtime cho booking.

## F. Luồng hoàn chỉnh

```text
Khách chọn photographer
        ↓
Đặt lịch
        ↓
Supabase booking
        ├──→ Admin realtime + âm báo
        ├──→ Telegram admin
        ├──→ Email admin
        ├──→ Email xác nhận khách (nếu có email)
        └──→ Zalo ZBS khách (nếu đã cấu hình)

Admin đổi trạng thái / tiền cọc
        ↓
Lưu thay đổi
        ├──→ Telegram admin
        ├──→ Email cập nhật khách
        └──→ Zalo ZBS cập nhật khách
```

## G. Bảo mật

API token Telegram, Resend và Zalo chỉ nằm trong **Edge Function Secrets**. Không đưa các token này vào source frontend.

Nếu một dịch vụ gửi lỗi, booking vẫn được lưu trong Supabase và vẫn xuất hiện ở Admin.

## Email nhận booking đã cài sẵn

Email admin nhận booking hiện tại:

```text
anhnguyenst39@gmail.com
```

Trong `booking-notify`, email này cũng được đặt làm địa chỉ mặc định nếu secret `ADMIN_EMAIL` chưa được khai báo.

Bạn vẫn nên thêm secret sau khi deploy:

```text
ADMIN_EMAIL=anhnguyenst39@gmail.com
```

Như vậy sau này muốn đổi địa chỉ nhận mail chỉ cần đổi secret, không cần sửa code.


# Trang đặt lịch riêng theo photographer

Bản này có thêm `lien-he.html`.

Nút **Đặt lịch** trên từng thẻ photographer đã được đổi thành URL riêng:

```text
lien-he.html?tho=quang-anh
lien-he.html?tho=chi
lien-he.html?tho=minh
lien-he.html?tho=ngoc-hoang
lien-he.html?tho=minh-anh
lien-he.html?tho=quang-vinh
```

Trang đặt lịch sẽ tự:

- đọc `?tho=...`,
- hiển thị đúng ảnh, ekip, phong cách, giá và photographer,
- kiểm tra lịch trống,
- gửi vào Supabase/Admin,
- gọi `booking-notify`,
- tiếp tục dùng Telegram + Email + Zalo ZBS nếu các provider đã được cấu hình.

Nếu chưa nối Supabase, trang hoạt động ở Demo Mode và lưu thử vào `localStorage`.


# Luồng liên trang Index → Hồ sơ thợ → Liên hệ

Bản này nối hoàn chỉnh ba bước:

```text
index.html
  ↓ Xem hồ sơ & ảnh
index.html?tho=quang-anh
  ↓ Chọn ngày / giờ / số lượng / gói
lien-he.html?tho=quang-anh&ngay=...&gio=...&soLuong=...&goi=...
  ↓ Gửi booking
Supabase → Admin → Telegram / Email / Zalo
```

Ngoài ra, nút **Đặt lịch** ngay trên card thợ ở `index.html` vẫn có thể đi thẳng tới:

```text
lien-he.html?tho=...
```

Trang hồ sơ thợ đã có khối **Đặt lịch với [Tên thợ]** và sticky CTA ở cuối màn hình.
Các lựa chọn trên hồ sơ được tự động điền sẵn sang trang liên hệ.


# Cập nhật trang hồ sơ thợ

Trang hồ sơ thợ đã được rút gọn:

- ảnh hero lớn hơn và phủ khung,
- 5 ảnh thay vì 4,
- moodboard ảnh lớn hơn,
- bỏ form chọn ngày / giờ / số lượng / gói ngay trên hồ sơ,
- khu đặt lịch chỉ còn **Giá từ** và **Đặt lịch**,
- nút đặt lịch chuyển thẳng sang `lien-he.html?tho=...`.

Thông tin chi tiết của khách chỉ nhập tại trang `lien-he.html`.


# Thêm lịch cá nhân / lịch đã có trong Admin

Trong `admin.html` → **Lịch chụp** đã có nút:

```text
+ Thêm lịch
```

Bạn có thể thêm:

- **Lịch đã có / đã chốt** — lịch nhận từ Zalo, Facebook, khách cũ hoặc kênh khác.
- **Lịch cá nhân** — việc riêng của photographer.
- **Lịch khác** — sự kiện nội bộ, workshop, nghỉ ekip...

Mỗi lịch có:

- tiêu đề,
- photographer,
- ngày,
- khung giờ Sáng / Chiều / Cả ngày,
- nguồn lịch,
- ghi chú,
- tùy chọn **Chặn khách mới đặt trùng**.

Nếu bật `Chặn khách mới đặt trùng`, `get_available_slots()` và `submit_booking()` sẽ coi lịch tự thêm này là lịch bận.

Lịch tự thêm hiển thị trực tiếp trong Calendar và có thể **Sửa / Xóa** từ chi tiết ngày.

Sau khi cập nhật bản này, hãy chạy lại `supabase-setup.sql` trong Supabase SQL Editor để tạo bảng `calendar_events` và cập nhật logic chống trùng lịch.


# Căn chỉnh khu photographer + Link Drive chờ

Bản này đã chỉnh khu **Chọn thợ**:

- card rộng và thoáng hơn,
- desktop hiển thị 3 card trong vùng nhìn thay vì 4 card quá hẹp,
- tablet 2 card,
- mobile 1 card lớn để vuốt,
- card đồng chiều cao,
- phần tên / tag / rating / giá / nút được căn lại,
- trang “Tất cả thợ” dùng lưới 3 → 2 → 1 cột.

## Link Drive ảnh tham khảo

Có thêm file:

`drive-links.js`

Mỗi photographer có một ô link riêng. Ví dụ:

```js
window.CHEESE_DRIVE_LINKS = {
  "quang-anh": "https://drive.google.com/drive/folders/...",
  "chi": "",
  "minh": "",
  "ngoc-hoang": "",
  "minh-anh": "",
  "quang-vinh": ""
};
```

Khi ô link còn trống:

- trang thợ hiển thị **Chờ thêm link Drive**,
- ảnh tham khảo vẫn hiển thị nhưng chưa mở link ngoài.

Khi dán link Drive:

- nút **Xem album ảnh trên Google Drive** tự hoạt động,
- khối Google Drive hiển thị trạng thái đã liên kết,
- từng ảnh tham khảo có thể bấm để mở album.

Không cần sửa lại `index.html` mỗi lần thay link.


# Luồng đặt lịch mới: Tin nhắn trực tiếp → Admin tự quản lý lịch

Bản này đã bỏ việc khách tự tạo booking vào Admin.

Luồng mới:

```text
Khách chọn photographer
        ↓
lien-he.html?tho=...
        ↓
Chọn ngày → website gọi get_available_slots()
        ↓
Hiện Còn lịch / Đã kín
        ↓
Website tạo sẵn tin nhắn
        ↓
Bấm Instagram / Zalo / Messenger
        ↓
Tin nhắn tự được copy → khách dán và gửi studio
        ↓
Studio xác nhận với khách
        ↓
Admin → Lịch chụp → + Thêm lịch
        ↓
Bật “Hiển thị HẾT LỊCH...” nếu khung giờ đã chốt/bận
        ↓
Website khách tự tra thấy khung giờ đó đã kín
```

## Kênh liên hệ studio

Sửa file:

`studio-contact.js`

Instagram mặc định đang dùng username:

```text
cheese.graduation
```

Nếu Instagram thật của studio khác, sửa:

```js
instagramUsername: "username_moi"
```

Thêm Zalo / Messenger:

```js
zaloUrl: "LINK_ZALO",
messengerUrl: "LINK_MESSENGER"
```

Instagram không cần chèn sẵn nội dung vào chat. Website sẽ tự copy đoạn tin nhắn trước khi mở kênh chat, khách chỉ cần dán.

## Admin là nguồn lịch chính

Trong **Admin → Lịch chụp → + Thêm lịch**:

- chọn photographer,
- chọn ngày,
- chọn Sáng / Chiều / Cả ngày,
- nhập tiêu đề và ghi chú,
- bật **Hiển thị HẾT LỊCH khung giờ này trên website khách**.

Nếu bật:
- `get_available_slots()` trả về khung giờ đã kín;
- trang khách hiển thị **Đã kín** và khóa lựa chọn đó.

Nếu tắt:
- lịch vẫn nằm trong Admin để ghi chú nội bộ;
- website khách vẫn hiển thị khung giờ còn trống.

Khách không có quyền thêm / sửa lịch trong database.


# Chuyển photographer nhanh trên trang đặt lịch

`lien-he.html` đã có thêm thanh **Chuyển thợ nhanh**.

Khách có thể bấm trực tiếp:

- Quang Anh
- Chi
- Minh
- Ngọc Hoàng
- Minh Anh
- Quang Vinh

Khi đổi photographer:

- ảnh đại diện đổi ngay,
- tên / ekip / phong cách / giá đổi ngay,
- dropdown photographer đồng bộ,
- lịch trống được tra lại theo photographer mới nếu khách đã chọn ngày,
- đoạn tin nhắn gửi studio được tạo lại theo đúng photographer,
- URL đổi thành `lien-he.html?tho=...`.

Desktop có nút mũi tên trái / phải. Mobile vuốt ngang các thẻ nhỏ.


# Chuyển photographer dạng ô nhỏ

Thanh photographer ngang đã được thu gọn thành một ô:

`Photographer · [Tên thợ hiện tại] ▾`

Khi bấm vào:
- mở popup danh sách toàn bộ photographer,
- mỗi thợ có ảnh, tên, ekip, phong cách và giá,
- photographer hiện tại được highlight,
- chọn thợ mới sẽ đóng popup và cập nhật toàn bộ trang,
- lịch trống và tin nhắn cũng đổi theo photographer mới.

# Instagram studio nhận lịch

Instagram nhận booking hiện tại:

```text
https://www.instagram.com/cheese.graphy/
```

Username dùng để mở Direct Message:

```text
cheese.graphy
```

Trang `lien-he.html` sẽ mở chat Instagram tới tài khoản này và tự sao chép nội dung booking trước khi chuyển sang Instagram.


# Nhạc nền YouTube

Nhạc nền MP3 nhúng cũ đã được thay bằng YouTube:

```text
https://www.youtube.com/watch?v=kzum5w6AtNQ
```

Website dùng YouTube IFrame Player API để giữ nút **Bật nhạc / Tắt nhạc**.

- Video được nhúng ẩn, chỉ dùng làm nhạc nền.
- Âm lượng mặc định: 22%.
- Tự lặp lại.
- Trạng thái bật/tắt tiếp tục lưu bằng `localStorage`.
- Trình duyệt có thể chặn autoplay có tiếng; nếu vậy nhạc bắt đầu sau tương tác đầu tiên của người dùng.


# Nhạc nền dùng file cục bộ

Bản này đã bỏ nhúng YouTube và dùng trực tiếp file:

```text
assets/audio/cheese-background.m4a
```

Nút **Bật nhạc / Tắt nhạc** vẫn hoạt động như trước.

Ưu điểm:
- không phụ thuộc YouTube,
- không hiện iframe/video,
- tải trực tiếp cùng website,
- vẫn nhớ trạng thái bật/tắt bằng localStorage,
- vẫn lặp lại khi phát.

Lưu ý: trình duyệt vẫn có thể chặn autoplay có tiếng. Nếu vậy nhạc sẽ bắt đầu sau lần click/chạm đầu tiên.


# Tự động bật nhạc khi mở website

Bản này đặt nhạc nền ở chế độ **auto start**:

- thẻ audio có `autoplay`,
- JavaScript gọi `audio.play()` ngay khi trang sẵn sàng,
- nếu trình duyệt chặn autoplay có tiếng, nhạc tự phát ở lần click/chạm/phím đầu tiên,
- khách không cần chủ động bấm “Bật nhạc” trong trường hợp fallback.

Lưu ý kỹ thuật: Chrome, Safari và iOS có chính sách chặn autoplay có tiếng trong nhiều trường hợp. Không có cách HTML/JavaScript hợp lệ nào ép trình duyệt bỏ qua chính sách đó; fallback tương tác đầu tiên là phương án ổn định nhất.


# Nhạc liên tục khi chuyển trang

Bản này dùng chung file:

`music-player.js`

cho:

- `index.html`
- hồ sơ photographer (`index.html?tho=...`)
- `lien-he.html`
- `admin.html`

Cơ chế:

1. trước khi rời trang, website lưu `currentTime` của bài nhạc;
2. trang mới đọc lại vị trí đó;
3. bù thêm một phần thời gian tải trang;
4. tiếp tục phát gần đúng vị trí đang nghe;
5. trạng thái Bật/Tắt cũng được giữ giữa các trang.

File nhạc dùng chung:

`assets/audio/cheese-background.m4a`

Do các trang là HTML riêng, trình duyệt vẫn phải tải trang mới nên có thể xuất hiện một khoảng ngắt rất ngắn. Muốn hoàn toàn không ngắt dù chỉ vài mili-giây thì cần chuyển toàn bộ website sang SPA / router một trang.


# Sửa thanh chữ chạy trang chính

Thanh:

`GROUP SHOT · FILM LOOK · EDITORIAL · CAMPUS STORY · PORTRAIT`

đã được sửa thành ticker full-width:

- nội dung kín toàn bộ chiều ngang,
- không còn khoảng trống lớn ở cuối dòng,
- dùng hai nhóm nội dung giống hệt nhau,
- vòng lặp nối liền không giật,
- desktop và mobile đều chạy liên tục.


# Cập nhật giao diện đặt lịch

Trang `lien-he.html` đã được cập nhật thêm:

- Khối **4 bước đặt lịch** ở đầu phần đặt lịch.
- **Bảng chọn gói chụp 1 → 5 người** bằng thanh kéo.
- Giá gói thay đổi theo photographer đang chọn.
- **Danh sách tỉnh/thành khu vực miền Trung trở vào Nam** kèm phí di chuyển tham khảo ngay trong ô chọn địa điểm.
- Thêm ô **Tên bạn** và **Số điện thoại** để nội dung tin nhắn đầy đủ hơn.

Quy ước gói chụp hiện tại:

- 1 người: giá gói lẻ theo photographer
- 2 người: +300.000đ
- 3 người: +600.000đ
- 4 người: +900.000đ
- 5 người: +1.200.000đ

Với photographer có giá `Liên hệ`, phần gói chụp sẽ hiển thị **Thợ báo giá**.


# BẢN CUỐI — Gói chụp + tỉnh thành + nút thời lượng

Trang `lien-he.html` đã hoàn thiện theo giao diện đặt lịch mới:

- **Cả ngày / Nửa ngày** dùng nút lớn như mẫu.
- Khi chọn **Nửa ngày**, hiện thêm **Buổi sáng / Buổi chiều**.
- Trạng thái nút tự khóa theo lịch trống lấy từ Admin/Supabase.
- Gói chụp **1 → 5 người** dùng 5 box riêng, không dùng slider.
- Mỗi box hiển thị giá tương ứng photographer đang chọn.
- Bảng tỉnh/thành từ **Thanh Hóa trở vào Nam** có nhóm vùng và phụ phí ngay cạnh tên tỉnh.
- Bảng phí được tách riêng trong `booking-prices.js` để sau này sửa giá nhanh.

Gói người hiện dùng phần cộng thêm:

- 1 người: +0đ
- 2 người: +300.000đ
- 3 người: +600.000đ
- 4 người: +900.000đ
- 5 người: +1.200.000đ

Muốn đổi giá tỉnh hoặc phụ thu số người chỉ sửa `booking-prices.js`.


# Photographer CMS trong Admin

Sau khi cập nhật bản này, chạy lại `supabase-setup.sql` trong Supabase SQL Editor.

Admin có thêm menu **Photographer**. Tại đây có thể:

- sửa tên / ekip / giá / nhãn giá,
- sửa phong cách / giới thiệu / tag / rating / số buổi chụp,
- thay ảnh đại diện,
- upload nhiều ảnh gallery,
- dán URL ảnh ngoài,
- xóa ảnh khỏi gallery và đổi thứ tự ảnh,
- thêm photographer mới,
- đổi thứ tự hiển thị,
- ẩn / hiện photographer trên website,
- xóa photographer nếu chưa liên kết booking/lịch.

Ảnh upload từ Admin được lưu trong Supabase Storage bucket `photographers`.

## Lưu ý khi xóa photographer

Booking và lịch đang tham chiếu photographer bằng tên. Nếu photographer đã có lịch sử booking, database sẽ chặn xóa để tránh mất liên kết. Trong trường hợp này hãy mở hồ sơ thợ và bỏ chọn **Hiển thị photographer trên website**. Thợ sẽ biến mất khỏi trang khách nhưng dữ liệu lịch cũ vẫn còn.

## Đồng bộ website

`photographer-public.js` đọc danh sách photographer đang `active=true` từ Supabase và cập nhật:

- card photographer trên trang chính,
- hồ sơ photographer,
- giá và ảnh,
- danh sách photographer trên `lien-he.html`,
- photographer mới thêm từ Admin.

Nếu Supabase chưa cấu hình, website tiếp tục dùng dữ liệu tĩnh cũ làm fallback.


# Cập nhật đặt lịch: miền Bắc + miền Trung / loại buổi chụp

- Danh sách tỉnh di chuyển đã bỏ Tây Nguyên, Đông Nam Bộ và Tây Nam Bộ.
- Chỉ còn miền Bắc và miền Trung.
- Có thêm lựa chọn **Kỷ yếu** / **Tốt nghiệp đại học** trên trang `lien-he.html`.
- Loại buổi chụp được thêm vào tin nhắn gửi Instagram/Zalo/Messenger.
- Có thể truyền sẵn bằng query `?loai=Kỷ%20yếu` hoặc `?loai=Tốt%20nghiệp%20đại%20học`.


# Tách Kỷ yếu và Tốt nghiệp đại học

Trang đặt lịch hiện có 2 tab riêng:

- **Kỷ yếu**: giữ nguyên gói 1–5 người và cách chọn hiện tại.
- **Tốt nghiệp đại học**: giao diện gói riêng theo mẫu, gồm 3 gói:
  - Chụp Lễ Tốt Nghiệp — từ 1.700.000đ — tối đa 2 người.
  - Chụp Pre-Grad — từ 2.000.000đ — tối đa 3 người.
  - Chụp Pre-Grad — từ 2.500.000đ — tối đa 4 người.

Mỗi người tăng thêm 300.000đ trong gói tốt nghiệp. Giá, số người và tên gói tự đi vào tin nhắn gửi studio.


# Căn chỉnh lại 4 bước đặt lịch

Phần 4 bước đã chuyển sang timeline 01–04:

1. Chọn thợ & loại chụp
2. Chọn gói & lịch
3. Nhắn studio
4. Cọc & chốt lịch

Desktop hiển thị 4 bước thẳng hàng có đường nối. Mobile tự chuyển thành timeline dọc để số và nội dung không bị lệch.


# Sửa nhạc nền v3

`music-player.js` hiện khôi phục `currentTime` trước khi play và không ghi timeupdate cho tới khi restore xong. Điều này sửa lỗi reload/chuyển trang bị quay về đầu bài.

Autoplay có tiếng vẫn phụ thuộc chính sách Chrome/Safari/iOS. Website thử phát có tiếng ngay; nếu bị chặn sẽ phát mute để timeline tiếp tục và tự bật tiếng ở lần tương tác đầu tiên.


# Giá & dịch vụ theo từng photographer

Trong **Admin → Photographer → Sửa hồ sơ & ảnh** đã có thêm 3 khối:

- **Giá Kỷ yếu**: nhập giá riêng cho 1, 2, 3, 4, 5 người.
- **Giá Tốt nghiệp đại học**: nhập giá riêng cho Lễ Tốt Nghiệp, Pre-Grad, Pre-Grad Plus và phụ thu mỗi người thêm.
- **Dịch vụ đi kèm**: thêm / sửa / xóa tên dịch vụ và nhãn hoặc giá hiển thị.

Các trường mới lưu trực tiếp trong bảng `photographers`:

```text
yearbook_prices
graduation_prices
graduation_extra_per_person
services
```

Sau khi cập nhật phiên bản này, chạy lại toàn bộ `supabase-setup.sql` một lần. Phần migration dùng `ADD COLUMN IF NOT EXISTS` và chỉ khởi tạo giá mặc định khi JSON đang trống, nên các lần chạy sau không ghi đè giá đã sửa trong Admin.


# Căn chỉnh chữ và hiệu ứng hover

Bản này đã thêm lớp polish giao diện cho toàn bộ website:

## Trang chính / hồ sơ thợ
- tăng line-height và khoảng cách giữa tiêu đề, mô tả, tag, giá và nút;
- tránh chữ dài bị dính/đè nhau;
- dịch vụ đi kèm tự xuống dòng hợp lý;
- hover ảnh photographer nhẹ hơn, không làm layout nhảy;
- hover nút, tim, mũi tên, icon Drive và nút nhạc có phản hồi nhẹ.

## Trang đặt lịch
- căn lại chữ ở timeline, tab Kỷ yếu / Tốt nghiệp, gói chụp, trạng thái lịch và tin nhắn;
- các box lựa chọn có hover nổi nhẹ;
- ảnh thợ và icon kênh liên hệ có hiệu ứng nhẹ;
- mobile tự xuống dòng ở các khối tổng kết để không bị chồng chữ.

## Admin
- tăng khoảng cách dòng trong menu, bảng, calendar, drawer và modal photographer;
- các trường giá/dịch vụ không dính chữ;
- hover card photographer, ảnh gallery, icon menu và các nút chỉnh sửa;
- focus input rõ hơn;
- giữ hiệu ứng nhẹ để không ảnh hưởng thao tác quản trị.


# Hồ sơ photographer — chỉ 5 ảnh đầu trang

- Trang xem photographer chỉ hiển thị tối đa 5 ảnh đầu tiên ngay trên đầu hồ sơ.
- Đã bỏ toàn bộ phần “Ảnh tham khảo · Album photographer” và khối Google Drive ở phía dưới.
- Khách vẫn có thể vuốt ngang, dùng mũi tên hoặc chấm điều hướng để xem 5 ảnh.
- Sau 5 ảnh là thông tin photographer, dịch vụ đi kèm và nút đặt lịch.


## Cập nhật hồ sơ photographer dạng ảnh mẫu

- Đầu trang hồ sơ hiển thị breadcrumb `Chọn thợ / Tên thợ`.
- Chỉ hiển thị tối đa 5 ảnh ở slider đầu trang.
- Dưới slider có dòng hướng dẫn vuốt để xem các ảnh còn lại.
- Ngay dưới ảnh có nút xanh mở album Google Drive của photographer.
- Thông tin thợ được rút gọn: tên + ekip, Hà Nội + rating + số buổi chụp, mô tả và tag.
- Link Drive hiện tại dùng link album chung đã cấu hình trong `drive-links.js`.


# Admin điều khiển toàn bộ nội dung hồ sơ thợ

Bản này nâng mục `Admin → Photographer → Sửa nội dung khách thấy`.

Admin có thể sửa trực tiếp:
- Ảnh 1: ảnh chính, đồng thời là ảnh card thợ ở trang chính.
- Ảnh 2–5: bốn ảnh vuốt tiếp theo trong hồ sơ thợ.
- Tên, ekip, khu vực hiển thị.
- Phong cách, mô tả, tag.
- Rating và số buổi đã chụp.
- Giá Kỷ yếu 1–5 người.
- Giá Tốt nghiệp đại học.
- Dịch vụ đi kèm.
- Link Google Drive album đầy đủ.
- Trạng thái hiện/ẩn photographer.

Hồ sơ khách chỉ lấy tối đa 5 ảnh đầu: `cover_url` + 4 `gallery_urls` đầu tiên.

## Cần chạy SQL một lần

Chạy lại `supabase-setup.sql` trong Supabase SQL Editor để thêm:
- `location_text`
- `drive_url`

SQL chỉ gán link Drive hiện tại cho 6 thợ cũ khi `drive_url` đang trống; về sau Admin sửa sẽ không bị chạy lại SQL ghi đè.


# Quản lý 5 ảnh từng photographer

Admin → Photographer giờ có 5 ô ảnh riêng cho từng thợ.

- Ảnh 1: ảnh chính và ảnh card ở trang chủ.
- Ảnh 2–5: ảnh vuốt trong hồ sơ thợ.
- Mỗi ô có thể chọn ảnh từ máy hoặc dán URL.
- Có thể xóa ảnh và dùng mũi tên trái/phải để đổi thứ tự.
- Ảnh chọn từ máy chỉ upload khi bấm **Lưu thay đổi**.
- Dữ liệu vẫn lưu trong `cover_url` + `gallery_urls`, nên không cần đổi cấu trúc database.


## Đường dẫn file sau khi tối ưu deploy
- `config.js`: vẫn ở thư mục gốc.
- Admin logic: `assets/js/admin/cheese-admin.js`.
- Booking logic: `assets/js/booking/`.
- Script dùng chung: `assets/js/shared/`.
- CSS: `assets/css/`.
- Ảnh trang chính: `assets/images/home/`.
