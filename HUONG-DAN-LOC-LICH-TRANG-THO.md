# Lọc lịch trống trên trang thợ (v44)

Trang `index.html?trang=tho` có thêm bộ chọn **Ngày chụp + Sáng/Chiều**.

## Dữ liệu được đọc từ đâu?

Trang dùng RPC `get_available_slots` đã có trong `supabase-setup.sql`. Hàm này tự kiểm tra:

- `bookings`: các booking chưa bị hủy/từ chối.
- `photographer_blocks`: ngày/ca bị khóa trong Admin.
- `calendar_events`: lịch Admin thêm thủ công có `blocks_booking = true`.

Vì vậy Admin không phải nhập lịch thêm ở nơi khác. Chỉ cần quản lý lịch như hiện tại.

## Quy tắc hiển thị

- Khách chọn ngày và **Sáng** hoặc **Chiều**.
- Chỉ photographer có ca đó `available = true` mới xuất hiện.
- Booking hoặc lịch khóa **Cả ngày** sẽ làm cả Sáng và Chiều bận.
- Nút **Đặt lịch** tự mang theo `ngay` và `gio` sang `lien-he.html`.
- Nếu Supabase/RPC lỗi, trang không tự ẩn thợ để tránh báo sai và sẽ hiện thông báo lỗi đồng bộ.

## Không cần migration mới

Bản này tận dụng `get_available_slots` có sẵn. Nếu database hiện tại đã chạy `supabase-setup.sql`/phần availability trước đó thì deploy web là dùng được ngay.
