# Đặt lịch qua tin nhắn

Trang `lien-he.html` hiện dùng mô hình:

**Tra lịch → Tạo tin nhắn → Copy → Instagram/Messenger**

Không còn insert booking trực tiếp từ phía khách.

File cần sửa kênh chat:

`studio-contact.js`

File quản lý link Drive:

`drive-links.js`

Admin quản lý lịch tại:

`admin.html` → **Lịch chụp** → **+ Thêm lịch**

Trạng thái **Hết lịch** của khách được tính từ:
- booking cũ đang hoạt động,
- ngày/khung giờ khóa,
- lịch admin tự thêm có `blocks_booking = true`.
