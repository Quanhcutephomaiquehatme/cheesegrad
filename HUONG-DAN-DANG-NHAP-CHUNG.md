# Đăng nhập chung cho studio

Mở `dang-nhap.html`. Nhập email và mật khẩu; hệ thống kiểm tra quyền trong Supabase và tự đưa admin đến `admin.html`, thợ đến `lich-tho.html`. Không cần chọn vai trò.

- Tài khoản admin được nhận diện qua `is_admin()` và bảng `admin_users`.
- Tài khoản thợ cần được gắn với hồ sơ đang hoạt động trong `photographer_accounts`.
- Người chưa được cấp quyền sẽ thấy thông báo tại trang đăng nhập.
- Mở đường dẫn admin hoặc lịch thợ khi chưa đăng nhập sẽ về trang đăng nhập chung. Mở nhầm trang khi đã đăng nhập sẽ chuyển đến trang đúng quyền.
- Đăng xuất trở về trang đăng nhập chung. Admin và thợ dùng cùng phiên đăng nhập trong một trình duyệt; muốn dùng đồng thời hai tài khoản, dùng hai hồ sơ trình duyệt khác nhau.
- Phiên thợ của bản cũ không còn được sử dụng; thợ đăng nhập lại một lần ở trang chung.
- Mục khám phá giao diện mẫu chỉ dùng dữ liệu minh họa, không cấp quyền truy cập dữ liệu thật.

## Cập nhật website

Tải toàn bộ bản web mới lên cùng hosting, bao gồm `dang-nhap.html`, `assets/js/shared/studio-auth.js`, `assets/js/shared/studio-login.js` và các file admin/lịch thợ đã sửa. Không cần SQL mới riêng cho việc gộp đăng nhập.

Nếu chưa kích hoạt tài khoản thợ và xác nhận lịch, làm theo `HUONG-DAN-TAI-KHOAN-XAC-NHAN.md`. Quyền đọc và xác nhận lịch vẫn được kiểm tra tại máy chủ; chuyển trang không thay thế phân quyền dữ liệu.

Chưa triển khai bản cập nhật lên website thật hoặc thử với tài khoản Supabase thật của studio.
