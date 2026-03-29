// ============= admin_system.js - HỆ THỐNG ADMIN (TỐI ĐA 3 NGƯỜI) =============

const MAX_ADMINS = 3;
const ADMIN_VERIFICATION_PHONE = '0878860704';
const { default: axios } = require('axios');

// ===== MODEL ADMIN REQUEST =====
const AdminRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  reason: { type: String, required: true },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedReason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const AdminRequest = mongoose.model('AdminRequest', AdminRequestSchema);

// ===== GỬI MÃ XÁC THỰC QUA ZALO =====
const sendZaloVerificationCode = async (phone, code) => {
  // Gửi mã qua Zalo API
  // Trong thực tế, bạn cần đăng ký Zalo Official Account API
  console.log(`📱 Gửi mã xác thực ${code} đến Zalo số: ${phone}`);
  
  // Mô phỏng gửi qua Zalo
  // Nếu là số admin chính, gửi thành công
  if (phone === ADMIN_VERIFICATION_PHONE) {
    return { success: true, message: 'Mã xác thực đã gửi qua Zalo' };
  }
  
  return { success: true, message: 'Mã xác thực đã gửi qua Zalo' };
};

// ===== API: ĐĂNG KÝ LÀM ADMIN =====
app.post('/api/admin/register-request', authenticateJWT, async (req, res) => {
  try {
    // Kiểm tra số lượng admin hiện tại
    const currentAdminCount = await User.countDocuments({ role: 'admin' });
    if (currentAdminCount >= MAX_ADMINS) {
      return res.status(403).json({ 
        error: `Hệ thống chỉ hỗ trợ tối đa ${MAX_ADMINS} admin. Hiện tại đã đủ số lượng.`,
        currentAdmins: currentAdminCount,
        maxAdmins: MAX_ADMINS
      });
    }
    
    const { reason } = req.body;
    const user = await User.findById(req.userId);
    
    // Kiểm tra đã có yêu cầu chưa
    const existingRequest = await AdminRequest.findOne({ email: user.email, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ error: 'Bạn đã có yêu cầu đang chờ xử lý' });
    }
    
    // Tạo yêu cầu
    const adminRequest = new AdminRequest({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      reason,
      status: 'pending'
    });
    await adminRequest.save();
    
    // Thông báo cho admin hiện tại
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        type: 'admin_request',
        title: 'Yêu cầu đăng ký admin mới',
        content: `${user.name} (${user.email}) muốn trở thành admin. Lý do: ${reason}`,
        data: { requestId: adminRequest._id, userId: user._id }
      });
    }
    
    res.json({
      success: true,
      message: 'Yêu cầu đã được gửi. Admin sẽ xem xét và liên hệ với bạn.',
      requestId: adminRequest._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN XÁC NHẬN YÊU CẦU =====
app.post('/api/admin/approve-request/:requestId', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const adminRequest = await AdminRequest.findById(req.params.requestId);
    if (!adminRequest) return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    if (adminRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Yêu cầu đã được xử lý' });
    }
    
    // Kiểm tra số lượng admin hiện tại
    const currentAdminCount = await User.countDocuments({ role: 'admin' });
    if (currentAdminCount >= MAX_ADMINS) {
      return res.status(403).json({ error: `Hệ thống chỉ hỗ trợ tối đa ${MAX_ADMINS} admin` });
    }
    
    // Tạo mã xác thực
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Lưu mã xác thực
    adminRequest.verificationCode = verificationCode;
    adminRequest.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    await adminRequest.save();
    
    // Gửi mã qua Zalo
    const zaloResult = await sendZaloVerificationCode(adminRequest.phone, verificationCode);
    
    res.json({
      success: true,
      message: 'Đã gửi mã xác thực qua Zalo. Vui lòng nhập mã để hoàn tất.',
      phone: adminRequest.phone,
      zaloSent: zaloResult.success,
      expiresIn: 10
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: XÁC NHẬN MÃ VÀ KÍCH HOẠT ADMIN =====
app.post('/api/admin/verify-and-activate', authenticateJWT, async (req, res) => {
  try {
    const { requestId, code } = req.body;
    const adminRequest = await AdminRequest.findById(requestId);
    
    if (!adminRequest) return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    if (adminRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Yêu cầu đã được xử lý' });
    }
    
    // Kiểm tra mã
    if (adminRequest.verificationCode !== code) {
      return res.status(400).json({ error: 'Mã xác thực không đúng' });
    }
    
    if (adminRequest.verificationCodeExpires < new Date()) {
      return res.status(400).json({ error: 'Mã xác thực đã hết hạn' });
    }
    
    // Kiểm tra số lượng admin hiện tại
    const currentAdminCount = await User.countDocuments({ role: 'admin' });
    if (currentAdminCount >= MAX_ADMINS) {
      return res.status(403).json({ error: `Hệ thống chỉ hỗ trợ tối đa ${MAX_ADMINS} admin` });
    }
    
    // Cập nhật user thành admin
    const user = await User.findOne({ email: adminRequest.email });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    
    user.role = 'admin';
    await user.save();
    
    // Cập nhật yêu cầu
    adminRequest.status = 'approved';
    adminRequest.approvedBy = req.userId;
    adminRequest.approvedAt = new Date();
    await adminRequest.save();
    
    // Thông báo
    await createNotification({
      userId: user._id,
      type: 'admin_activated',
      title: 'Chúc mừng! Bạn đã trở thành Admin',
      content: 'Bạn đã được kích hoạt quyền quản trị viên. Hãy sử dụng quyền hạn một cách có trách nhiệm.',
      data: { role: 'admin' }
    });
    
    res.json({
      success: true,
      message: 'Kích hoạt admin thành công!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: LẤY DANH SÁCH YÊU CẦU ADMIN =====
app.get('/api/admin/requests', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const requests = await AdminRequest.find().sort({ createdAt: -1 });
    res.json({
      requests,
      currentAdminCount: await User.countDocuments({ role: 'admin' }),
      maxAdmins: MAX_ADMINS
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN RÚT TIỀN TỰ DO =====
app.post('/api/admin/withdraw', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    
    if (!amount || amount < 100000) {
      return res.status(400).json({ error: 'Số tiền rút tối thiểu 100,000 VNĐ' });
    }
    
    // Kiểm tra tổng doanh thu trong hệ thống
    const totalRevenue = await Transaction.aggregate([
      { $match: { type: { $in: ['deposit', 'subscription', 'purchase_diamonds', 'withdrawal_fee'] }, status: 'success' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const totalWithdrawn = await Transaction.aggregate([
      { $match: { type: 'admin_withdraw', status: 'success' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const availableBalance = (totalRevenue[0]?.total || 0) - (totalWithdrawn[0]?.total || 0);
    
    if (availableBalance < amount) {
      return res.status(400).json({ 
        error: 'Số dư doanh thu không đủ',
        available: availableBalance,
        requested: amount
      });
    }
    
    // Ghi nhận giao dịch rút tiền của admin
    const transaction = new Transaction({
      user: req.userId,
      type: 'admin_withdraw',
      amount: -amount,
      description: `Admin rút ${amount.toLocaleString()}đ về ${bankName} - ${accountNumber}`,
      status: 'success',
      completedAt: new Date(),
      bankInfo: { bankName, accountNumber, accountName },
      reference: `ADMIN_WITHDRAW_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    });
    await transaction.save();
    
    // Thực hiện chuyển tiền thật (gọi API ngân hàng)
    const transferResult = await autoTransferToBank({
      bankName,
      accountNumber,
      accountName,
      amount,
      transactionId: transaction._id
    });
    
    if (!transferResult.success) {
      transaction.status = 'failed';
      await transaction.save();
      return res.status(500).json({ error: 'Chuyển tiền thất bại' });
    }
    
    res.json({
      success: true,
      message: `Đã rút ${amount.toLocaleString()}đ về tài khoản ${bankName} - ${accountNumber}`,
      transactionId: transaction._id,
      remainingBalance: availableBalance - amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: LẤY THÔNG TIN ADMIN HIỆN TẠI =====
app.get('/api/admin/info', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('name email avatar createdAt');
    const adminCount = admins.length;
    
    res.json({
      currentAdmin: req.user,
      allAdmins: admins,
      adminCount,
      maxAdmins: MAX_ADMINS,
      canAddMore: adminCount < MAX_ADMINS
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: XÓA ADMIN (CHỈ ADMIN CHÍNH) =====
app.delete('/api/admin/remove/:userId', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    if (targetUser.role !== 'admin') {
      return res.status(400).json({ error: 'Người dùng không phải admin' });
    }
    
    // Không cho phép tự xóa chính mình
    if (targetUser._id.toString() === req.userId) {
      return res.status(400).json({ error: 'Không thể tự xóa chính mình' });
    }
    
    targetUser.role = 'user';
    await targetUser.save();
    
    await createNotification({
      userId: targetUser._id,
      type: 'admin_removed',
      title: 'Quyền admin đã bị thu hồi',
      content: 'Quyền quản trị viên của bạn đã bị thu hồi.',
      data: { removedBy: req.user.name }
    });
    
    res.json({ success: true, message: 'Đã thu hồi quyền admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});