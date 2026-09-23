/*
  CHEESE.GRADUATION — BẢNG GIÁ ĐẶT LỊCH
  Khu vực di chuyển: miền Bắc + Bắc Trung Bộ.
  Có thể chỉnh giá tại đây mà không cần sửa giao diện.
*/
window.CHEESE_BOOKING_PRICES = {
  referencePriceFrom: 1500000,

  packageExtra: {
    1: 0,
    2: 300000,
    3: 600000,
    4: 900000,
    5: 1200000
  },

  graduationPackages: [
    {
      id: "ceremony",
      name: "Chụp Lễ Tốt Nghiệp",
      basePrice: 1700000,
      maxPeople: 2,
      groupLabel: "Nhóm tối đa 2 người",
      detail: "Trả toàn bộ file ảnh, chỉnh màu, retouch nhẹ"
    },
    {
      id: "pregrad",
      name: "Chụp Pre-Grad",
      basePrice: 2000000,
      maxPeople: 3,
      groupLabel: "Nhóm tối đa 3 người",
      detail: "Trả toàn bộ file ảnh, chỉnh màu, trả 10 ảnh photoshop"
    },
    {
      id: "pregrad-plus",
      name: "Chụp Pre-Grad",
      basePrice: 2500000,
      maxPeople: 4,
      groupLabel: "Nhóm tối đa 4 người",
      detail: "Trả toàn bộ file ảnh, chỉnh màu, trả 20 ảnh photoshop"
    }
  ],

  graduationExtraPerPerson: 300000,

  teamBasePrices: [
    {
      id: "founder",
      label: "Founder",
      priceFrom: 2800000,
      description: "Founder & Photographer của Cheese.Graduation. Phù hợp những booking cần concept kỹ, định hướng hình ảnh rõ và trải nghiệm cá nhân hoá.",
      teams: ["Founder"]
    },
    {
      id: "ekip1",
      label: "Ekip 1",
      priceFrom: 2500000,
      description: "Nhóm photographer chủ lực của Cheese.Graduation, giàu kinh nghiệm, xử lý linh hoạt và có phong cách cá nhân rõ nét.",
      teams: ["Ekip 1"]
    },
    {
      id: "ekip23",
      label: "Ekip 2,3",
      priceFrom: 2200000,
      description: "Những photographer trẻ của Cheese.Graduation, đa dạng phong cách, bắt trend nhanh và làm việc theo cùng tiêu chuẩn của ekip.",
      teams: ["Ekip 2", "Ekip 3"]
    },
    {
      id: "takecare",
      label: "Take Care",
      priceFrom: 1500000,
      description: "Nhân sự đồng hành xuyên suốt buổi chụp: hỗ trợ trang phục, tóc, phụ kiện, chỉnh dáng, giữ đồ và những nhu cầu phát sinh.",
      teams: []
    }
  ],

  provinceGroups: [
    {
      label: "Miền Bắc",
      items: [
        ["Hà Nội (2 địa điểm nội thành Hà Nội)", "100.000đ"],
        ["Hà Nội (ngoại thành)", "200.000đ"],
        ["Vĩnh Phúc", "300.000đ"],
        ["Bắc Ninh", "300.000đ"],
        ["Hải Dương", "400.000đ"],
        ["Thái Nguyên", "500.000đ"],
        ["Bắc Giang", "500.000đ"],
        ["Hà Nam", "500.000đ"],
        ["Ninh Bình", "500.000đ - 600.000đ"],
        ["Hải Phòng", "600.000đ"],
        ["Quảng Ninh", "600.000đ"],
        ["Phú Thọ", "600.000đ"],
        ["Hạ Long", "700.000đ"],
        ["Lạng Sơn", "800.000đ"],
        ["Sơn La", "800.000đ"],
        ["Tuyên Quang", "800.000đ"],
        ["Bắc Kạn", "800.000đ"],
        ["Lai Châu", "800.000đ - 1.200.000đ"],
        ["Lào Cai", "900.000đ"]
      ]
    },
    {
      label: "Bắc Trung Bộ",
      items: [
        ["Thanh Hoá", "800.000đ"],
        ["Nghệ An", "900.000đ - 1.000.000đ"],
        ["Hà Tĩnh", "900.000đ - 1.200.000đ"]
      ]
    }
  ],

  provinceDetails: {
    "Hà Nội (2 địa điểm nội thành Hà Nội)": "Áp dụng khi 2 điểm chụp cách nhau trên 5km.",
    "Hà Nội (ngoại thành)": "Chỉ chụp tại trường.",
    "Vĩnh Phúc": "Tính theo 1 thợ.",
    "Bắc Ninh": "Tính theo 1 thợ.",
    "Lạng Sơn": "Tính theo 1 thợ.",
    "Hải Dương": "Tính theo 1 thợ.",
    "Thái Nguyên": "Tính theo 1 thợ.",
    "Hải Phòng": "Các huyện xa trung tâm có thể chênh thêm một chút.",
    "Hạ Long": "Tính theo 1 thợ.",
    "Quảng Ninh": "Tính theo 1 thợ.",
    "Phú Thọ": "Tính theo 1 thợ.",
    "Sơn La": "Tính theo 1 thợ.",
    "Lào Cai": "Tính theo 1 thợ.",
    "Tuyên Quang": "Tính theo 1 thợ.",
    "Bắc Kạn": "Tính theo 1 thợ.",
    "Thanh Hoá": "Tính theo 1 thợ.",
    "Ninh Bình": "Xa trung tâm thành phố: 600.000đ.",
    "Nghệ An": "Huyện xa trung tâm thành phố: 1.000.000đ - 1.200.000đ tuỳ địa điểm, do thợ cần lưu trú qua đêm để chụp đúng giờ.",
    "Hà Tĩnh": "Huyện xa trung tâm thành phố: 1.000.000đ - 1.200.000đ tuỳ địa điểm, do thợ cần lưu trú qua đêm để chụp đúng giờ.",
    "Lai Châu": "Huyện xa trung tâm thành phố: 1.000.000đ - 1.200.000đ tuỳ địa điểm, do thợ cần lưu trú qua đêm để chụp đúng giờ.",
    "Bắc Giang": "Tính theo 1 thợ.",
    "Hà Nam": "Tính theo 1 thợ."
  }
};
