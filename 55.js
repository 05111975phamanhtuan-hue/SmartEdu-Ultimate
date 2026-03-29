// ============= data/bank_config.json - FILE CẤU HÌNH QR CODE =============
// Bạn có thể sửa file này bất cứ lúc nào, không cần restart server!

{
  "banks": [
    {
      "id": "vcb",
      "name": "Vietcombank",
      "code": "VCB",
      "accountNumber": "1234567890",
      "accountName": "NGUYEN VAN A",
      "qrCodeUrl": "https://api.vietqr.io/image/VCB-1234567890-nganhang.jpg",
      "isActive": true
    },
    {
      "id": "vtb",
      "name": "Vietinbank",
      "code": "ICB",
      "accountNumber": "1234567891",
      "accountName": "NGUYEN VAN A",
      "qrCodeUrl": "https://api.vietqr.io/image/ICB-1234567891-nganhang.jpg",
      "isActive": true
    },
    {
      "id": "agb",
      "name": "Agribank",
      "code": "AGB",
      "accountNumber": "1234567892",
      "accountName": "NGUYEN VAN A",
      "qrCodeUrl": "https://api.vietqr.io/image/AGB-1234567892-nganhang.jpg",
      "isActive": true
    }
  ],
  "termsAndConditions": {
    "title": "ĐIỀU KHOẢN NẠP TIỀN",
    "content": [
      "1. Số tiền nạp sẽ được quy đổi thành Kim Cương (💎) với tỷ lệ 500 VNĐ = 1💎",
      "2. Kim Cương có thể dùng để mua tài liệu, mở khóa nội dung VIP, nâng cấp gói Pro/Family.",
      "3. Kim Cương KHÔNG thể quy đổi ngược lại thành tiền mặt.",
      "4. Sau khi nạp tiền, vui lòng liên hệ admin để xác nhận (có thể mất 5-15 phút).",
      "5. Mọi thắc mắc vui lòng liên hệ: hotline 1900 xxxx hoặc email support@smartedu.com"
    ],
    "confirmText": "Tôi đã đọc và đồng ý với các điều khoản trên"
  },
  "adminContact": {
    "zalo": "https://zalo.me/0123456789",
    "messenger": "https://m.me/smartedu",
    "hotline": "1900 1234"
  }
}