# Trang lịch dành cho thợ

Mở **dang-nhap.html**. Mục **Khám phá giao diện mẫu → Xem thử lịch thợ** dùng được ngay để xem giao diện mà không đăng nhập. Đây là dữ liệu minh họa tách biệt, không thay đổi dữ liệu studio.

## Kích hoạt lịch thật (quản trị thực hiện một lần)

Làm theo **HUONG-DAN-TAI-KHOAN-XAC-NHAN.md**: chạy `SUPABASE-PATCH-ACCOUNTS-CONFIRMATION.sql`, triển khai Edge Function cấp tài khoản và tải toàn bộ bản web mới lên hosting. Bản SQL mới đã bao gồm thiết lập trang lịch; không chạy bản `SUPABASE-PATCH-PHOTOGRAPHER-PORTAL.sql` cũ sau bản mới.

Admin cấp email và mật khẩu ngay trong mục Photographer. Thợ đăng nhập tại `/lich-tho.html` bằng tài khoản được cấp.

## Cách sử dụng

- Dùng mũi tên để chuyển tháng, “Hôm nay” để quay lại ngày hiện tại.
- Chọn ô ngày để xem các lịch của ngày đó; chọn “Cả tháng” để bỏ giới hạn ngày.
- Tìm theo tên khách, lớp, trường hoặc mã lịch; lọc trạng thái.
- Nhấn vào lịch để xem ca chụp, gói, số người, ghi chú và số điện thoại khách nếu có.
- Lịch chụp, lịch bổ sung và ngày khóa đều lấy từ dữ liệu admin đang quản lý.
- Trang tự làm mới mỗi phút khi đang mở; nút “Làm mới” lấy dữ liệu ngay.
- Thợ có thể xác nhận đã nhận lịch trong chi tiết buổi chụp. Thay đổi / hủy lịch vẫn thực hiện ở admin.

## Phạm vi truy cập

- Mỗi tài khoản thợ chỉ đọc lịch của hồ sơ đã được studio gắn với tài khoản đó, kiểm tra ở máy chủ bằng `auth.uid()`.
- Không dùng bộ chọn tên thợ để cấp quyền. Tài khoản chưa được gắn hoặc hồ sơ ngừng hoạt động không nhận được dữ liệu.
- Chỉ trả về các trường phục vụ buổi chụp; không trả doanh thu, tiền cọc, ghi chú nội bộ booking hoặc dữ liệu tài chính.
- Ghi chú của lịch bổ sung `calendar_events.note` được thợ xem. Admin không nên đặt thông tin tài chính / ghi chú chỉ dành cho quản trị vào trường này.
- Bản cập nhật giữ các quyền admin hiện có. Không cấp quyền admin cho tài khoản thợ; tài khoản vốn là admin vẫn có quyền admin ở các trang khác.
- Thu hồi quyền: xóa dòng tương ứng trong `photographer_accounts`, hoặc vô hiệu hóa tài khoản ở Supabase. Quyền đọc được kiểm tra lại mỗi lần tải lịch.
- Trang này dùng chung phiên đăng nhập với admin. Xem `HUONG-DAN-DANG-NHAP-CHUNG.md`.

## Kiểm tra sau khi cài

Đăng nhập bằng hai tài khoản thợ khác nhau; mỗi bên phải chỉ nhận lịch của mình. Thử tài khoản chưa liên kết: phải hiển thị thông báo chưa cấp quyền. Thay đổi lịch trên admin rồi nhấn “Làm mới” ở trang thợ. Đăng xuất: dữ liệu phải biến mất.

Đã kiểm tra giao diện trên Chromium ở màn hình máy tính và điện thoại, cùng các luồng dữ liệu giả lập và chạy migration trên PostgreSQL cục bộ: phân tách hai tài khoản, chặn tài khoản chưa liên kết / bị vô hiệu hóa, chặn tự cấp quyền và không trả dữ liệu tài chính. Chưa chạy migration hay đăng nhập vào Supabase thật của studio; cần hoàn thành các bước kích hoạt trên để dùng lịch thật.
