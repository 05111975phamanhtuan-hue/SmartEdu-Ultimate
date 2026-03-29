// ============= terms_of_service.js - ĐIỀU KHOẢN DỊCH VỤ =============

// Model lưu lịch sử đồng ý điều khoản
const TermsAgreementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  version: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
  agreedAt: { type: Date, default: Date.now }
});

const TermsAgreement = mongoose.model('TermsAgreement', TermsAgreementSchema);

// Phiên bản điều khoản hiện tại
const CURRENT_TERMS_VERSION = '2.0';
const TERMS_UPDATE_DATE = '2025-03-29';

// Nội dung điều khoản dịch vụ
const TERMS_OF_SERVICE = {
  version: CURRENT_TERMS_VERSION,
  lastUpdated: TERMS_UPDATE_DATE,
  sections: [
    {
      title: "1. Giới thiệu chung",
      content: "SmartEdu là nền tảng học tập trực tuyến dành cho học sinh Việt Nam từ lớp 6 đến lớp 12. Khi sử dụng dịch vụ, bạn đồng ý tuân thủ các điều khoản dưới đây."
    },
    {
      title: "2. Điều khoản sử dụng",
      content: "2.1. Bạn phải từ đủ 13 tuổi trở lên để sử dụng dịch vụ.\n2.2. Bạn chịu trách nhiệm về tài khoản của mình.\n2.3. Không được chia sẻ tài khoản cho người khác.\n2.4. Không được sử dụng tài khoản để thực hiện hành vi vi phạm pháp luật."
    },
    {
      title: "3. Nội dung và tài liệu",
      content: "3.1. Tài liệu trên nền tảng là tài sản trí tuệ của người đăng tải hoặc của SmartEdu.\n3.2. Không được sao chép, phân phối trái phép tài liệu.\n3.3. Người bán tài liệu cam kết tài liệu không vi phạm bản quyền.\n3.4. SmartEdu có quyền từ chối đăng tải nội dung vi phạm."
    },
    {
      title: "4. Chính sách thanh toán và hoàn tiền",
      content: "4.1. Tất cả giao dịch đều được thực hiện qua ví điện tử SmartEdu.\n4.2. Tiền nạp vào ví KHÔNG được hoàn trả.\n4.3. Người mua tài liệu KHÔNG được yêu cầu hoàn tiền sau khi đã tải về.\n4.4. Người bán tài liệu có thể rút tiền khi đủ 500.000 VNĐ và được duyệt bởi admin.\n4.5. Phí rút tiền: 500 VNĐ/lần.\n4.6. Phí nền tảng: 20% trên mỗi giao dịch bán tài liệu."
    },
    {
      title: "5. Chính sách bảo mật",
      content: "5.1. SmartEdu cam kết bảo vệ thông tin cá nhân của người dùng.\n5.2. Thông tin ngân hàng được mã hóa trước khi lưu trữ.\n5.3. Không chia sẻ thông tin với bên thứ ba khi chưa được sự đồng ý."
    },
    {
      title: "6. Quy định về nội dung",
      content: "6.1. Không đăng tải nội dung vi phạm pháp luật.\n6.2. Không đăng tải nội dung khiêu dâm, bạo lực, kích động thù địch.\n6.3. Không spam, quảng cáo trái phép.\n6.4. Vi phạm sẽ bị khóa tài khoản và không được hoàn trả tiền."
    },
    {
      title: "7. Quyền và nghĩa vụ của người dùng",
      content: "7.1. Người dùng có quyền truy cập nội dung đã mua.\n7.2. Người dùng có quyền yêu cầu hỗ trợ từ đội ngũ quản trị.\n7.3. Người dùng có nghĩa vụ bảo mật thông tin tài khoản.\n7.4. Người dùng có nghĩa vụ tuân thủ điều khoản dịch vụ."
    },
    {
      title: "8. Giới hạn trách nhiệm",
      content: "8.1. SmartEdu không chịu trách nhiệm về thiệt hại gián tiếp.\n8.2. SmartEdu có quyền tạm ngưng dịch vụ để bảo trì.\n8.3. SmartEdu không đảm bảo dịch vụ không bị gián đoạn."
    },
    {
      title: "9. Thay đổi điều khoản",
      content: "SmartEdu có quyền thay đổi điều khoản dịch vụ. Người dùng sẽ được thông báo và cần đồng ý lại để tiếp tục sử dụng."
    },
    {
      title: "10. Giải quyết tranh chấp",
      content: "Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng. Nếu không thành công, sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền."
    },
    {
      title: "11. Liên hệ",
      content: "Mọi thắc mắc vui lòng liên hệ:\n- Email: support@smartedu.com\n- Hotline: 1900 xxxx\n- Zalo: 0878860704"
    }
  ]
};

// ===== MIDDLEWARE: KIỂM TRA ĐÃ ĐỒNG Ý ĐIỀU KHOẢN =====
const checkTermsAgreement = async (req, res, next) => {
  // Bỏ qua các route không cần kiểm tra
  const skipRoutes = ['/api/auth/login', '/api/auth/register', '/api/terms', '/api/health'];
  if (skipRoutes.includes(req.path)) return next();
  
  const user = await User.findById(req.userId);
  if (!user) return next();
  
  const latestAgreement = await TermsAgreement.findOne({ 
    user: req.userId, 
    version: CURRENT_TERMS_VERSION 
  });
  
  if (!latestAgreement && req.method !== 'GET') {
    return res.status(403).json({ 
      error: 'Bạn cần đồng ý với Điều khoản dịch vụ mới nhất để tiếp tục',
      requireTermsAgreement: true,
      terms: TERMS_OF_SERVICE
    });
  }
  
  next();
};
app.use('/api', checkTermsAgreement);

// ===== API: LẤY ĐIỀU KHOẢN DỊCH VỤ =====
app.get('/api/terms', async (req, res) => {
  res.json(TERMS_OF_SERVICE);
});

// ===== API: ĐỒNG Ý ĐIỀU KHOẢN DỊCH VỤ =====
app.post('/api/terms/agree', authenticateJWT, async (req, res) => {
  try {
    const { version } = req.body;
    
    if (version !== CURRENT_TERMS_VERSION) {
      return res.status(400).json({ error: 'Phiên bản điều khoản không hợp lệ' });
    }
    
    // Kiểm tra đã đồng ý chưa
    const existing = await TermsAgreement.findOne({ 
      user: req.userId, 
      version: CURRENT_TERMS_VERSION 
    });
    
    if (existing) {
      return res.json({ success: true, message: 'Bạn đã đồng ý điều khoản trước đó' });
    }
    
    // Lưu lịch sử đồng ý
    const agreement = new TermsAgreement({
      user: req.userId,
      version: CURRENT_TERMS_VERSION,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    await agreement.save();
    
    res.json({ 
      success: true, 
      message: 'Đã đồng ý điều khoản dịch vụ',
      agreedAt: agreement.agreedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: KIỂM TRA TRẠNG THÁI ĐỒNG Ý =====
app.get('/api/terms/status', authenticateJWT, async (req, res) => {
  try {
    const latestAgreement = await TermsAgreement.findOne({ 
      user: req.userId, 
      version: CURRENT_TERMS_VERSION 
    });
    
    res.json({
      hasAgreed: !!latestAgreement,
      agreedAt: latestAgreement?.agreedAt || null,
      currentVersion: CURRENT_TERMS_VERSION,
      terms: TERMS_OF_SERVICE
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});