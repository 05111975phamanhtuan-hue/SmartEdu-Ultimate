// ============= auto_withdrawal.js - RÚT TIỀN TỰ ĐỘNG =============

const MIN_WITHDRAWAL_AMOUNT = 500000; // 500.000 VNĐ tối thiểu

// ===== API: YÊU CẦU RÚT TIỀN (TỰ ĐỘNG) =====
app.post('/api/seller/withdraw', authenticateJWT, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    
    // 1. Kiểm tra số tiền rút
    if (!amount || amount < MIN_WITHDRAWAL_AMOUNT) {
      return res.status(400).json({ 
        error: `Số tiền rút tối thiểu ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()} VNĐ`,
        minAmount: MIN_WITHDRAWAL_AMOUNT
      });
    }
    
    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin ngân hàng' });
    }
    
    // 2. Kiểm tra số dư BALANCE của người bán
    const user = await User.findById(req.userId);
    if (user.balance < amount) {
      return res.status(400).json({ 
        error: 'Số dư trong ví không đủ',
        balance: user.balance,
        requested: amount
      });
    }
    
    // 3. Trừ BALANCE người bán (tiền ảo)
    user.balance -= amount;
    await user.save();
    
    // 4. Ghi nhận giao dịch
    const transaction = new Transaction({
      user: req.userId,
      type: 'withdraw',
      amount: -amount,
      description: `Rút ${amount.toLocaleString()}đ về ${bankName} - ${accountNumber}`,
      status: 'processing',
      bankInfo: { bankName, accountNumber, accountName },
      reference: `WITHDRAW_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    });
    await transaction.save();
    
    // 5. TẠO LỆNH CHUYỂN TIỀN TỰ ĐỘNG (Mô phỏng API ngân hàng)
    // Trong thực tế, bạn sẽ gọi API của ngân hàng để chuyển tiền
    const transferResult = await autoTransferToBank({
      bankName,
      accountNumber,
      accountName,
      amount,
      transactionId: transaction._id
    });
    
    if (transferResult.success) {
      transaction.status = 'success';
      transaction.completedAt = new Date();
      await transaction.save();
      
      // Thông báo thành công
      await createNotification({
        userId: req.userId,
        type: 'withdraw_success',
        title: 'Rút tiền thành công',
        content: `Đã chuyển ${amount.toLocaleString()}đ vào tài khoản ${bankName} - ${accountNumber}.`,
        data: { amount, bankName, accountNumber }
      });
      
      res.json({
        success: true,
        message: `Rút tiền thành công! ${amount.toLocaleString()}đ đã được chuyển vào tài khoản của bạn.`,
        remainingBalance: user.balance,
        transactionId: transaction._id
      });
    } else {
      // Nếu chuyển thất bại, hoàn tiền lại vào ví
      user.balance += amount;
      await user.save();
      
      transaction.status = 'failed';
      transaction.adminNote = transferResult.error;
      await transaction.save();
      
      res.status(500).json({ 
        error: 'Chuyển tiền thất bại, vui lòng thử lại sau',
        details: transferResult.error
      });
    }
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== HÀM MÔ PHỎNG CHUYỂN TIỀN TỰ ĐỘNG =====
const autoTransferToBank = async ({ bankName, accountNumber, accountName, amount, transactionId }) => {
  try {
    // Trong thực tế, đây là nơi gọi API ngân hàng
    // Ví dụ: Gọi API Vietcombank, Vietinbank, Agribank...
    
    // Giả lập chuyển tiền thành công
    console.log(`
    ========================================
    CHUYỂN TIỀN TỰ ĐỘNG
    ========================================
    Mã giao dịch: ${transactionId}
    Ngân hàng: ${bankName}
    Số tài khoản: ${accountNumber}
    Chủ tài khoản: ${accountName}
    Số tiền: ${amount.toLocaleString()} VNĐ
    Trạng thái: THÀNH CÔNG
    ========================================
    `);
    
    // Giả lập delay xử lý
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
    
  } catch (error) {
    console.error('Auto transfer failed:', error);
    return { success: false, error: error.message };
  }
};

// ===== API: KIỂM TRA SỐ DƯ CÓ THỂ RÚT =====
app.get('/api/seller/withdraw-info', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const canWithdraw = user.balance >= MIN_WITHDRAWAL_AMOUNT;
    const remainingToMin = canWithdraw ? 0 : MIN_WITHDRAWAL_AMOUNT - user.balance;
    
    // Lấy danh sách các ngân hàng hỗ trợ
    const supportedBanks = [
      { id: 'vcb', name: 'Vietcombank', code: 'VCB' },
      { id: 'vtb', name: 'Vietinbank', code: 'ICB' },
      { id: 'agb', name: 'Agribank', code: 'AGB' },
      { id: 'bidv', name: 'BIDV', code: 'BIDV' },
      { id: 'tcb', name: 'Techcombank', code: 'TCB' },
      { id: 'mb', name: 'MB Bank', code: 'MB' },
      { id: 'vp', name: 'VPBank', code: 'VPB' },
      { id: 'stb', name: 'Sacombank', code: 'STB' },
      { id: 'acb', name: 'ACB', code: 'ACB' },
      { id: 'shb', name: 'SHB', code: 'SHB' }
    ];
    
    // Lấy lịch sử rút tiền
    const withdrawalHistory = await Transaction.find({
      user: req.userId,
      type: 'withdraw'
    }).sort({ createdAt: -1 }).limit(20);
    
    res.json({
      balance: user.balance,
      minWithdrawAmount: MIN_WITHDRAWAL_AMOUNT,
      canWithdraw,
      remainingToMin,
      supportedBanks,
      withdrawalHistory: withdrawalHistory.map(w => ({
        amount: w.amount,
        bankInfo: w.bankInfo,
        status: w.status,
        createdAt: w.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: CẬP NHẬT THÔNG TIN NGÂN HÀNG CỦA NGƯỜI DÙNG =====
app.post('/api/seller/bank-info', authenticateJWT, async (req, res) => {
  try {
    const { bankName, accountNumber, accountName } = req.body;
    
    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    const user = await User.findById(req.userId);
    user.bankInfo = { bankName, accountNumber, accountName };
    await user.save();
    
    res.json({ success: true, bankInfo: user.bankInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN XEM LỊCH SỬ RÚT TIỀN =====
app.get('/api/admin/withdrawals', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const query = {};
    if (status !== 'all') query.status = status;
    
    const withdrawals = await Transaction.find({ type: 'withdraw', ...query })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments({ type: 'withdraw', ...query });
    const totalWithdrawn = await Transaction.aggregate([
      { $match: { type: 'withdraw', status: 'success' } },
      { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
    ]);
    
    res.json({
      withdrawals,
      totalWithdrawn: totalWithdrawn[0]?.total || 0,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN XỬ LÝ RÚT TIỀN THỦ CÔNG (NẾU TỰ ĐỘNG LỖI) =====
app.patch('/api/admin/withdrawals/:withdrawalId/process', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const transaction = await Transaction.findById(req.params.withdrawalId);
    
    if (!transaction) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    if (transaction.type !== 'withdraw') {
      return res.status(400).json({ error: 'Không phải giao dịch rút tiền' });
    }
    
    if (status === 'success') {
      transaction.status = 'success';
      transaction.completedAt = new Date();
      transaction.adminNote = adminNote;
      await transaction.save();
      
      await createNotification({
        userId: transaction.user,
        type: 'withdraw_success',
        title: 'Rút tiền thành công',
        content: `Yêu cầu rút ${Math.abs(transaction.amount).toLocaleString()}đ đã được xử lý.`,
        data: { amount: transaction.amount }
      });
    } else if (status === 'failed') {
      // Hoàn tiền lại cho người dùng
      const user = await User.findById(transaction.user);
      user.balance += Math.abs(transaction.amount);
      await user.save();
      
      transaction.status = 'failed';
      transaction.adminNote = adminNote;
      await transaction.save();
      
      await createNotification({
        userId: transaction.user,
        type: 'withdraw_failed',
        title: 'Rút tiền thất bại',
        content: `Yêu cầu rút tiền của bạn bị từ chối. Lý do: ${adminNote}`,
        data: { amount: transaction.amount }
      });
    }
    
    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});