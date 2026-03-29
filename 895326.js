// ============= terms_of_service_admin.js - ADMIN QUẢN LÝ ĐIỀU KHOẢN =============

// ===== MODEL LƯU ĐIỀU KHOẢN =====
const TermsVersionSchema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  title: { type: String, default: 'Điều khoản dịch vụ SmartEdu' },
  sections: [{
    title: { type: String, required: true },
    content: { type: String, required: true },
    order: { type: Number, default: 0 }
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  effectiveDate: { type: Date, default: Date.now }
});

const TermsVersion = mongoose.model('TermsVersion', TermsVersionSchema);

// ===== KHỞI TẠO PHIÊN BẢN MẶC ĐỊNH =====
const initDefaultTerms = async () => {
  const existing = await TermsVersion.findOne({ isActive: true });
  if (!existing) {
    const defaultTerms = new TermsVersion({
      version: '1.0',
      sections: [
        { title: '1. Giới thiệu chung', content: 'SmartEdu là nền tảng học tập trực tuyến dành cho học sinh Việt Nam từ lớp 6 đến lớp 12. Khi sử dụng dịch vụ, bạn đồng ý tuân thủ các điều khoản dưới đây.', order: 1 },
        { title: '2. Điều khoản sử dụng', content: '2.1. Bạn phải từ đủ 13 tuổi trở lên để sử dụng dịch vụ.\n2.2. Bạn chịu trách nhiệm về tài khoản của mình.\n2.3. Không được chia sẻ tài khoản cho người khác.\n2.4. Không được sử dụng tài khoản để thực hiện hành vi vi phạm pháp luật.', order: 2 },
        { title: '3. Nội dung và tài liệu', content: '3.1. Tài liệu trên nền tảng là tài sản trí tuệ của người đăng tải hoặc của SmartEdu.\n3.2. Không được sao chép, phân phối trái phép tài liệu.\n3.3. Người bán tài liệu cam kết tài liệu không vi phạm bản quyền.\n3.4. SmartEdu có quyền từ chối đăng tải nội dung vi phạm.', order: 3 },
        { title: '4. Chính sách thanh toán và hoàn tiền', content: '4.1. Tất cả giao dịch đều được thực hiện qua ví điện tử SmartEdu.\n4.2. Tiền nạp vào ví KHÔNG được hoàn trả.\n4.3. Người mua tài liệu KHÔNG được yêu cầu hoàn tiền sau khi đã tải về.\n4.4. Người bán tài liệu có thể rút tiền khi đủ 500.000 VNĐ và được duyệt bởi admin.\n4.5. Phí rút tiền: 500 VNĐ/lần.\n4.6. Phí nền tảng: 20% trên mỗi giao dịch bán tài liệu.', order: 4 },
        { title: '5. Chính sách bảo mật', content: '5.1. SmartEdu cam kết bảo vệ thông tin cá nhân của người dùng.\n5.2. Thông tin ngân hàng được mã hóa trước khi lưu trữ.\n5.3. Không chia sẻ thông tin với bên thứ ba khi chưa được sự đồng ý.', order: 5 },
        { title: '6. Quy định về nội dung', content: '6.1. Không đăng tải nội dung vi phạm pháp luật.\n6.2. Không đăng tải nội dung khiêu dâm, bạo lực, kích động thù địch.\n6.3. Không spam, quảng cáo trái phép.\n6.4. Vi phạm sẽ bị khóa tài khoản và không được hoàn trả tiền.', order: 6 },
        { title: '7. Quyền và nghĩa vụ của người dùng', content: '7.1. Người dùng có quyền truy cập nội dung đã mua.\n7.2. Người dùng có quyền yêu cầu hỗ trợ từ đội ngũ quản trị.\n7.3. Người dùng có nghĩa vụ bảo mật thông tin tài khoản.\n7.4. Người dùng có nghĩa vụ tuân thủ điều khoản dịch vụ.', order: 7 },
        { title: '8. Giới hạn trách nhiệm', content: '8.1. SmartEdu không chịu trách nhiệm về thiệt hại gián tiếp.\n8.2. SmartEdu có quyền tạm ngưng dịch vụ để bảo trì.\n8.3. SmartEdu không đảm bảo dịch vụ không bị gián đoạn.', order: 8 },
        { title: '9. Thay đổi điều khoản', content: 'SmartEdu có quyền thay đổi điều khoản dịch vụ. Người dùng sẽ được thông báo và cần đồng ý lại để tiếp tục sử dụng.', order: 9 },
        { title: '10. Giải quyết tranh chấp', content: 'Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng. Nếu không thành công, sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền.', order: 10 },
        { title: '11. Liên hệ', content: 'Mọi thắc mắc vui lòng liên hệ:\n- Email: support@smartedu.com\n- Hotline: 1900 xxxx\n- Zalo: 0878860704', order: 11 }
      ],
      createdBy: null,
      isActive: true,
      effectiveDate: new Date()
    });
    await defaultTerms.save();
  }
};

// Gọi khởi tạo khi server start
initDefaultTerms();

// ===== MIDDLEWARE: LẤY PHIÊN BẢN ĐIỀU KHOẢN HIỆN TẠI =====
const getCurrentTerms = async () => {
  return await TermsVersion.findOne({ isActive: true }).sort({ version: -1 });
};

// ===== API: LẤY ĐIỀU KHOẢN HIỆN TẠI =====
app.get('/api/terms', async (req, res) => {
  try {
    const terms = await getCurrentTerms();
    if (!terms) {
      return res.status(404).json({ error: 'Không tìm thấy điều khoản' });
    }
    
    // Lấy lịch sử đồng ý của user (nếu đã đăng nhập)
    let userAgreement = null;
    if (req.userId) {
      userAgreement = await TermsAgreement.findOne({ 
        user: req.userId, 
        version: terms.version 
      });
    }
    
    res.json({
      id: terms._id,
      version: terms.version,
      title: terms.title,
      sections: terms.sections.sort((a, b) => a.order - b.order),
      effectiveDate: terms.effectiveDate,
      lastUpdated: terms.createdAt,
      hasUserAgreed: !!userAgreement,
      userAgreedAt: userAgreement?.agreedAt || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: LẤY TẤT CẢ PHIÊN BẢN (ADMIN) =====
app.get('/api/admin/terms/versions', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const versions = await TermsVersion.find().sort({ version: -1 });
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: TẠO PHIÊN BẢN MỚI (ADMIN) =====
app.post('/api/admin/terms', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { version, title, sections, effectiveDate } = req.body;
    
    if (!version || !sections || sections.length === 0) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    // Kiểm tra phiên bản đã tồn tại
    const existing = await TermsVersion.findOne({ version });
    if (existing) {
      return res.status(400).json({ error: 'Phiên bản đã tồn tại' });
    }
    
    // Vô hiệu hóa phiên bản hiện tại
    await TermsVersion.updateMany({ isActive: true }, { isActive: false });
    
    // Tạo phiên bản mới
    const newTerms = new TermsVersion({
      version,
      title: title || 'Điều khoản dịch vụ SmartEdu',
      sections: sections.map((s, idx) => ({ ...s, order: s.order || idx + 1 })),
      isActive: true,
      createdBy: req.userId,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date()
    });
    await newTerms.save();
    
    // Gửi thông báo cho tất cả user về việc cập nhật điều khoản
    const users = await User.find({ role: 'user' });
    for (const user of users) {
      await createNotification({
        userId: user._id,
        type: 'terms_update',
        title: 'Điều khoản dịch vụ đã được cập nhật',
        content: `Phiên bản ${version} của điều khoản dịch vụ đã có hiệu lực. Vui lòng đọc và đồng ý để tiếp tục sử dụng.`,
        data: { version, effectiveDate: newTerms.effectiveDate }
      });
    }
    
    res.json({ 
      success: true, 
      terms: newTerms,
      message: `Đã tạo phiên bản ${version} và gửi thông báo đến người dùng`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: CẬP NHẬT PHIÊN BẢN (ADMIN) =====
app.put('/api/admin/terms/:id', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { title, sections, isActive, effectiveDate } = req.body;
    const terms = await TermsVersion.findById(req.params.id);
    
    if (!terms) return res.status(404).json({ error: 'Không tìm thấy điều khoản' });
    
    if (title) terms.title = title;
    if (sections) terms.sections = sections.map((s, idx) => ({ ...s, order: s.order || idx + 1 }));
    if (isActive !== undefined) terms.isActive = isActive;
    if (effectiveDate) terms.effectiveDate = new Date(effectiveDate);
    
    await terms.save();
    
    res.json({ success: true, terms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: XÓA PHIÊN BẢN (ADMIN) =====
app.delete('/api/admin/terms/:id', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const terms = await TermsVersion.findById(req.params.id);
    if (!terms) return res.status(404).json({ error: 'Không tìm thấy điều khoản' });
    
    await terms.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: USER ĐỒNG Ý ĐIỀU KHOẢN (CÓ NÚT) =====
app.post('/api/terms/agree', authenticateJWT, async (req, res) => {
  try {
    const { version } = req.body;
    const terms = await TermsVersion.findOne({ version, isActive: true });
    
    if (!terms) {
      return res.status(404).json({ error: 'Phiên bản điều khoản không hợp lệ' });
    }
    
    // Kiểm tra đã đồng ý chưa
    const existing = await TermsAgreement.findOne({ 
      user: req.userId, 
      version: terms.version 
    });
    
    if (existing) {
      return res.json({ 
        success: true, 
        message: 'Bạn đã đồng ý điều khoản trước đó',
        agreedAt: existing.agreedAt
      });
    }
    
    // Lưu lịch sử đồng ý
    const agreement = new TermsAgreement({
      user: req.userId,
      version: terms.version,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    await agreement.save();
    
    res.json({ 
      success: true, 
      message: 'Đã đồng ý điều khoản dịch vụ',
      agreedAt: agreement.agreedAt,
      version: terms.version
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: KIỂM TRA TRẠNG THÁI ĐỒNG Ý =====
app.get('/api/terms/status', authenticateJWT, async (req, res) => {
  try {
    const currentTerms = await getCurrentTerms();
    if (!currentTerms) {
      return res.status(404).json({ error: 'Không tìm thấy điều khoản' });
    }
    
    const latestAgreement = await TermsAgreement.findOne({ 
      user: req.userId, 
      version: currentTerms.version 
    });
    
    res.json({
      hasAgreed: !!latestAgreement,
      agreedAt: latestAgreement?.agreedAt || null,
      currentVersion: currentTerms.version,
      termsId: currentTerms._id,
      terms: {
        version: currentTerms.version,
        title: currentTerms.title,
        sections: currentTerms.sections.sort((a, b) => a.order - b.order),
        effectiveDate: currentTerms.effectiveDate
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});