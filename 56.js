// ============= MODULE 5: HỆ THỐNG NẠP TIỀN VỚI QR CODE =============
// Thêm vào server.js

const fs = require('fs');
const path = require('path');

// Đọc file cấu hình QR code (có thể thay đổi bất cứ lúc nào)
const BANK_CONFIG_PATH = path.join(__dirname, 'data', 'bank_config.json');

// Hàm đọc cấu hình ngân hàng (luôn lấy mới nhất)
const getBankConfig = () => {
  try {
    const config = JSON.parse(fs.readFileSync(BANK_CONFIG_PATH, 'utf8'));
    return config;
  } catch (error) {
    console.error('Error reading bank config:', error);
    return { banks: [], termsAndConditions: {}, adminContact: {} };
  }
};

// ============= API: LẤY THÔNG TIN NẠP TIỀN (QR CODE) =============
app.get('/api/payment/banks', authenticateJWT, async (req, res) => {
  try {
    const config = getBankConfig();
    
    // Lọc chỉ hiển thị ngân hàng đang active
    const activeBanks = config.banks.filter(bank => bank.isActive !== false);
    
    res.json({
      success: true,
      banks: activeBanks.map(bank => ({
        id: bank.id,
        name: bank.name,
        code: bank.code,
        qrCodeUrl: bank.qrCodeUrl,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName
      })),
      termsAndConditions: config.termsAndConditions,
      adminContact: config.adminContact
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= API: TẠO YÊU CẦU NẠP TIỀN =============
app.post('/api/payment/deposit-request', authenticateJWT, async (req, res) => {
  try {
    const { amount, bankId, reference } = req.body;
    const config = getBankConfig();
    
    const bank = config.banks.find(b => b.id === bankId);
    if (!bank) {
      return res.status(400).json({ error: 'Ngân hàng không hợp lệ' });
    }
    
    if (amount < 50000) {
      return res.status(400).json({ error: 'Số tiền nạp tối thiểu 50,000 VNĐ' });
    }
    
    // Tạo mã giao dịch duy nhất
    const transactionId = `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Tạo giao dịch chờ xác nhận
    const pendingDeposit = new PendingDeposit({
      user: req.userId,
      amount: amount,
      bankId: bankId,
      bankName: bank.name,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      reference: reference || transactionId,
      transactionId: transactionId,
      status: 'pending',
      qrCodeUrl: bank.qrCodeUrl
    });
    await pendingDeposit.save();
    
    // Tạo QR Code động với số tiền và nội dung
    const qrContent = `https://img.vietqr.io/image/${bank.code}-${bank.accountNumber}-compact.png?amount=${amount}&addInfo=${transactionId}&accountName=${encodeURIComponent(bank.accountName)}`;
    
    res.json({
      success: true,
      transactionId: transactionId,
      bankInfo: {
        name: bank.name,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName
      },
      qrCodeUrl: qrContent,
      amount: amount,
      reference: transactionId,
      message: `Vui lòng quét mã QR hoặc chuyển khoản với nội dung: ${transactionId}`,
      termsAndConditions: config.termsAndConditions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= API: ADMIN XÁC NHẬN NẠP TIỀN (THỦ CÔNG) =============
// AI sẽ gọi API này khi admin xác nhận đã nhận được tiền
app.post('/api/admin/confirm-deposit', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { transactionId, notes } = req.body;
    
    const pendingDeposit = await PendingDeposit.findOne({ transactionId });
    if (!pendingDeposit) {
      return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    }
    
    if (pendingDeposit.status !== 'pending') {
      return res.status(400).json({ error: 'Giao dịch đã được xử lý' });
    }
    
    // Cập nhật trạng thái
    pendingDeposit.status = 'completed';
    pendingDeposit.completedAt = new Date();
    pendingDeposit.adminNotes = notes;
    await pendingDeposit.save();
    
    // Cộng tiền ảo (balance) vào ví user
    const user = await User.findById(pendingDeposit.user);
    user.balance += pendingDeposit.amount;
    await user.save();
    
    // Gửi thông báo cho user
    const notification = new Notification({
      user: user._id,
      title: '💰 Nạp tiền thành công',
      content: `Bạn vừa nạp ${pendingDeposit.amount.toLocaleString()}đ vào ví SmartEdu. Số dư hiện tại: ${user.balance.toLocaleString()}đ`,
      type: 'success',
      isRead: false
    });
    await notification.save();
    
    // Gửi email thông báo (nếu có)
    if (user.email) {
      await sendEmail(user.email, 'Nạp tiền thành công', `Chúc mừng! Bạn đã nạp ${pendingDeposit.amount.toLocaleString()}đ vào ví SmartEdu.`);
    }
    
    res.json({
      success: true,
      user: user._id,
      userName: user.name,
      amount: pendingDeposit.amount,
      balance: user.balance,
      message: `Đã xác nhận nạp ${pendingDeposit.amount.toLocaleString()}đ cho user ${user.name}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= API: LẤY DANH SÁCH GIAO DỊCH CHỜ XÁC NHẬN (CHO ADMIN) =============
app.get('/api/admin/pending-deposits', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const pendingDeposits = await PendingDeposit.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json(pendingDeposits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= API: USER KIỂM TRA TRẠNG THÁI GIAO DỊCH =============
app.get('/api/payment/transaction/:transactionId', authenticateJWT, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await PendingDeposit.findOne({ 
      transactionId: transactionId,
      user: req.userId 
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    }
    
    res.json({
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      completedAt: transaction.completedAt,
      bankInfo: {
        name: transaction.bankName,
        accountNumber: transaction.accountNumber,
        accountName: transaction.accountName
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});