// ============= two_factor_withdrawal.js - DUYỆT RÚT 2 BƯỚC =============

// Danh sách 5 mã bảo mật cho super admin
const SUPER_ADMIN_CODES = ['SMART001', 'SMART002', 'SMART003', 'SMART004', 'SMART005'];

// ===== API: USER YÊU CẦU RÚT TIỀN =====
app.post('/api/withdraw/request', authenticateJWT, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    const user = await User.findById(req.userId);
    
    if (!amount || amount < 500000) {
      return res.status(400).json({ error: 'Số tiền rút tối thiểu 500,000 VNĐ' });
    }
    
    // Kiểm tra số dư có thể rút (chỉ từ bán tài liệu)
    const sellerEarnings = await SellerEarnings.aggregate([
      { $match: { seller: req.userId, status: 'available' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const availableBalance = sellerEarnings[0]?.total || 0;
    if (availableBalance < amount) {
      return res.status(400).json({ 
        error: 'Số dư khả dụng không đủ (chỉ tiền từ bán tài liệu mới được rút)',
        available: availableBalance,
        requested: amount
      });
    }
    
    const fee = 500;
    const totalDeduct = amount + fee;
    
    // Tạo yêu cầu rút tiền
    const withdrawalRequest = new WithdrawalApproval({
      user: req.userId,
      userName: user.name,
      userEmail: user.email,
      amount,
      fee,
      totalDeduct,
      bankInfo: { bankName, accountNumber, accountName },
      status: 'pending'
    });
    await withdrawalRequest.save();
    
    // Gửi thông báo cho admin phụ và admin chính
    const admins = await User.find({ role: 'admin' });
    const superAdmins = await AdminHierarchy.find({ role: 'super_admin' }).populate('user');
    
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        type: 'withdrawal_request',
        title: 'Yêu cầu rút tiền mới',
        content: `${user.name} yêu cầu rút ${amount.toLocaleString()}đ. Cần duyệt!`,
        data: { requestId: withdrawalRequest._id, amount, userName: user.name }
      });
    }
    
    res.json({
      success: true,
      requestId: withdrawalRequest._id,
      message: 'Yêu cầu rút tiền đã được gửi. Vui lòng chờ admin duyệt.',
      status: 'pending'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN PHỤ DUYỆT (BƯỚC 1) =====
app.post('/api/admin/withdraw/approve-step1/:requestId', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const withdrawalRequest = await WithdrawalApproval.findById(req.params.requestId);
    if (!withdrawalRequest) return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    if (withdrawalRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Yêu cầu đã được xử lý' });
    }
    
    // Admin phụ duyệt
    withdrawalRequest.status = 'approved_by_admin';
    withdrawalRequest.approvedByAdmin = req.userId;
    withdrawalRequest.approvedByAdminAt = new Date();
    await withdrawalRequest.save();
    
    // Gửi thông báo cho super admin
    const superAdmins = await AdminHierarchy.find({ role: 'super_admin' }).populate('user');
    for (const superAdmin of superAdmins) {
      await createNotification({
        userId: superAdmin.user._id,
        type: 'withdrawal_step1_complete',
        title: 'Yêu cầu rút tiền đã được admin duyệt',
        content: `Yêu cầu rút ${withdrawalRequest.amount.toLocaleString()}đ của ${withdrawalRequest.userName} đã được admin duyệt. Cần super admin xác nhận bước 2.`,
        data: { requestId: withdrawalRequest._id, amount: withdrawalRequest.amount }
      });
    }
    
    res.json({
      success: true,
      message: 'Đã duyệt bước 1. Đang chờ super admin xác nhận bước 2.',
      status: 'approved_by_admin'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: SUPER ADMIN DUYỆT BƯỚC 2 (CẦN 5 MÃ) =====
app.post('/api/super-admin/withdraw/approve-step2/:requestId', authenticateJWT, authenticateSuperAdmin, async (req, res) => {
  try {
    const { codes } = req.body; // mảng 5 mã
    const withdrawalRequest = await WithdrawalApproval.findById(req.params.requestId);
    
    if (!withdrawalRequest) return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    if (withdrawalRequest.status !== 'approved_by_admin') {
      return res.status(400).json({ error: 'Yêu cầu chưa được admin duyệt bước 1' });
    }
    
    // Kiểm tra 5 mã bảo mật
    if (!codes || codes.length !== 5) {
      return res.status(400).json({ error: 'Cần nhập đủ 5 mã bảo mật' });
    }
    
    // So sánh với danh sách mã cố định
    const isValid = codes.every(code => SUPER_ADMIN_CODES.includes(code));
    if (!isValid) {
      return res.status(403).json({ error: 'Mã bảo mật không đúng' });
    }
    
    // Cập nhật trạng thái
    withdrawalRequest.status = 'approved_by_super';
    withdrawalRequest.approvedBySuper = req.userId;
    withdrawalRequest.approvedBySuperAt = new Date();
    await withdrawalRequest.save();
    
    // Trừ tiền từ earnings của người dùng
    let remainingToDeduct = withdrawalRequest.totalDeduct;
    const earningsToUpdate = await SellerEarnings.find({ 
      seller: withdrawalRequest.user, 
      status: 'available' 
    }).sort({ createdAt: 1 });
    
    for (const earning of earningsToUpdate) {
      if (remainingToDeduct <= 0) break;
      
      if (earning.amount <= remainingToDeduct) {
        earning.status = 'withdrawn';
        earning.withdrawnAt = new Date();
        remainingToDeduct -= earning.amount;
      } else {
        const remainingAmount = earning.amount - remainingToDeduct;
        earning.amount = remainingToDeduct;
        earning.status = 'withdrawn';
        earning.withdrawnAt = new Date();
        
        const newEarning = new SellerEarnings({
          seller: earning.seller,
          material: earning.material,
          order: earning.order,
          amount: remainingAmount,
          originalAmount: earning.originalAmount,
          platformFee: earning.platformFee * (remainingAmount / earning.originalAmount),
          status: 'available'
        });
        await newEarning.save();
        remainingToDeduct = 0;
      }
      await earning.save();
    }
    
    // Cập nhật ví admin
    const wallet = await AdminWallet.findOne();
    if (wallet) {
      wallet.availableForWithdrawal -= withdrawalRequest.amount;
      wallet.pendingWithdrawals -= withdrawalRequest.totalDeduct;
      wallet.transactions.push({
        type: 'withdrawal_complete',
        amount: -withdrawalRequest.amount,
        userId: withdrawalRequest.user,
        description: `Rút tiền cho ${withdrawalRequest.userName}: ${withdrawalRequest.amount.toLocaleString()}đ`,
        createdAt: new Date()
      });
      await wallet.save();
    }
    
    // Chuyển tiền thật vào tài khoản người dùng
    const transferResult = await autoTransferToBank({
      bankName: withdrawalRequest.bankInfo.bankName,
      accountNumber: withdrawalRequest.bankInfo.accountNumber,
      accountName: withdrawalRequest.bankInfo.accountName,
      amount: withdrawalRequest.amount,
      transactionId: withdrawalRequest._id
    });
    
    if (transferResult.success) {
      withdrawalRequest.status = 'completed';
      withdrawalRequest.completedAt = new Date();
      await withdrawalRequest.save();
      
      // Thông báo cho người dùng
      await createNotification({
        userId: withdrawalRequest.user,
        type: 'withdrawal_success',
        title: 'Rút tiền thành công',
        content: `Yêu cầu rút ${withdrawalRequest.amount.toLocaleString()}đ đã được xử lý thành công.`,
        data: { amount: withdrawalRequest.amount }
      });
      
      res.json({
        success: true,
        message: `Đã xử lý rút ${withdrawalRequest.amount.toLocaleString()}đ thành công!`,
        transactionId: withdrawalRequest._id
      });
    } else {
      withdrawalRequest.status = 'processing';
      await withdrawalRequest.save();
      res.json({
        success: false,
        message: 'Đã duyệt nhưng chuyển tiền thất bại. Sẽ xử lý lại sau.',
        status: 'processing'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: TỪ CHỐI YÊU CẦU RÚT TIỀN =====
app.post('/api/admin/withdraw/reject/:requestId', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const withdrawalRequest = await WithdrawalApproval.findById(req.params.requestId);
    
    if (!withdrawalRequest) return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    if (withdrawalRequest.status !== 'pending' && withdrawalRequest.status !== 'approved_by_admin') {
      return res.status(400).json({ error: 'Không thể từ chối yêu cầu này' });
    }
    
    withdrawalRequest.status = 'rejected';
    withdrawalRequest.rejectionReason = reason;
    withdrawalRequest.rejectionBy = req.userId;
    await withdrawalRequest.save();
    
    // Thông báo cho người dùng
    await createNotification({
      userId: withdrawalRequest.user,
      type: 'withdrawal_rejected',
      title: 'Yêu cầu rút tiền bị từ chối',
      content: `Yêu cầu rút ${withdrawalRequest.amount.toLocaleString()}đ của bạn bị từ chối. Lý do: ${reason}`,
      data: { amount: withdrawalRequest.amount, reason }
    });
    
    res.json({ success: true, message: 'Đã từ chối yêu cầu rút tiền' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: XEM DANH SÁCH YÊU CẦU RÚT TIỀN =====
app.get('/api/admin/withdraw/requests', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const requests = await WithdrawalApproval.find({ status })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});