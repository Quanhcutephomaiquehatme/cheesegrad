> Bản mới dùng trang đăng nhập chung `dang-nhap.html`, tự chuyển theo quyền admin/thợ. Xem `HUONG-DAN-DANG-NHAP-CHUNG.md`.

# Cấp tài khoản trong Admin và xác nhận lịch của thợ

## Kích hoạt một lần

1. Chạy `SUPABASE-PATCH-ACCOUNTS-CONFIRMATION.sql` trong SQL Editor của Supabase hiện có. File này đã bao gồm bản cập nhật lịch thợ trước đó. Sau khi chạy file mới, không chạy lại file portal cũ vì hàm trả lịch cũ không có trạng thái xác nhận.
2. Nếu bước trên báo trùng liên kết một thợ, kiểm tra bảng `photographer_accounts` và giữ đúng một tài khoản cho mỗi thợ trước khi chạy lại; không tự xóa tài khoản Auth.
3. Triển khai Edge Function `photographer-account` từ thư mục `supabase/functions/photographer-account`. Có thể dùng Supabase CLI từ thư mục dự án:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set ALLOWED_ORIGINS=https://TEN-MIEN-WEB-CUA-BAN
supabase functions deploy photographer-account --no-verify-jwt
```

`ALLOWED_ORIGINS` là tên miền chính xác có `https://`, không có dấu `/` cuối. Nếu có nhiều tên miền, ngăn cách bằng dấu phẩy. Khi chạy thử local, thêm origin chính xác (ví dụ `http://localhost:8000`). Không mở trang bằng `file://` khi cấp tài khoản thật.

Function tự kiểm tra JWT bằng Auth `getUser`, rồi kiểm tra `is_admin` trên máy chủ trước bất kỳ thao tác tài khoản nào. Cờ `--no-verify-jwt` chỉ bỏ kiểm tra ở gateway để tương thích cấu hình publishable key; không bỏ kiểm tra người dùng trong function.

Supabase hosted tự cung cấp các biến `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` cho Edge Function. Khóa service role chỉ dùng ở máy chủ; không thêm vào `config.js` hoặc HTML. Mật khẩu không được lưu vào bảng công khai, localStorage, log hay trả lại trong kết quả.

4. Tải bộ web cập nhật lên hosting. Có thể dùng các file trang mới và admin mới cùng thư mục assets hiện có.

## Admin cấp tài khoản

- Đăng nhập `admin.html` → **Photographer** → trên thẻ thợ chọn **Tài khoản đăng nhập**.
- Thợ chưa có tài khoản: nhập email chưa dùng, mật khẩu 10–128 ký tự → **Tạo tài khoản cho thợ**. Hệ thống tạo tài khoản Auth và liên kết ngay với đúng hồ sơ thợ. Email được xác nhận bởi admin; không tự gửi email.
- Thợ đã có tài khoản: email được khóa để tránh gán nhầm. Nhập mật khẩu mới → **Đặt mật khẩu mới**. Không thể xem lại mật khẩu cũ.
- Thông báo email / mật khẩu và đường dẫn `/lich-tho.html` cho thợ qua kênh riêng của studio.
- Nếu email đã tồn tại nhưng chưa liên kết, function không tự lấy hoặc đặt lại tài khoản đó. Quản trị xác minh đúng người, rồi liên kết UID bằng SQL theo `HUONG-DAN-LICH-THO.md`.
- Không dùng email admin làm tài khoản thợ. Nếu đã gắn nhầm trước đó, gỡ liên kết và tạo tài khoản riêng.
- Đặt lại mật khẩu không thay đổi người được giao lịch, cũng không thay thế việc khóa/thu hồi tài khoản. Khi cần thu hồi truy cập ngay, gỡ liên kết `photographer_accounts` hoặc khóa tài khoản ở Auth.

## Thợ xác nhận lịch

- Đăng nhập `lich-tho.html` bằng tài khoản studio cấp. Máy chủ chỉ trả lịch thuộc hồ sơ gắn với `auth.uid()`; không có bộ chọn để xem lịch người khác.
- Mở lịch → **Xác nhận nhận lịch chụp**. Áp dụng cho booking và lịch admin tự thêm; ngày bị khóa không có nút xác nhận.
- Thời gian xác nhận được ghi ở máy chủ. Nhấn lặp lại không làm đổi thời điểm xác nhận đầu tiên.
- Lịch đã hủy / từ chối / hoàn thành không nhận xác nhận mới.
- Nếu admin đổi người chụp, ngày, ca, thông tin buổi chụp hoặc ghi chú gửi cho thợ, xác nhận cũ bị xóa, phiên bản lịch tăng. Thợ phải đọc và xác nhận lại. Thay đổi tiền cọc, ghi chú nội bộ hoặc chuyển trạng thái studio sang “Đã chốt” không tự xóa xác nhận.
- Xác nhận của thợ không thay đổi trạng thái chốt lịch hay tiền cọc của khách.

## Admin kiểm tra

- Mục **Photographer → Xác nhận lịch của thợ** có bộ lọc “Chưa xác nhận / Đã xác nhận / Tất cả” và thời gian xác nhận.
- Trên thẻ lịch sắp tới, tổng quan và chi tiết booking cũng có trạng thái của thợ.
- Admin tự kiểm tra mỗi 30 giây khi trang đang mở. Bấm **Làm mới** trong khung xác nhận để cập nhật ngay. Đây là cập nhật trong trang web, không gửi email/SMS.
- Thử bằng hai tài khoản để xác nhận không nhìn hoặc xác nhận thay lịch của nhau. Sau đó sửa ca chụp ở admin và kiểm tra xác nhận chuyển về trạng thái chờ.

## Phạm vi bàn giao

Có đầy đủ mã web, SQL và Edge Function. Chưa triển khai function, chưa chạy SQL hay tạo tài khoản trên Supabase thật của studio. Chế độ demo không tạo tài khoản và không gửi xác nhận về dữ liệu thật.
