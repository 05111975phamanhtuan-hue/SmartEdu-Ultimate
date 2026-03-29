// ============= MODULE 5: HỆ THỐNG THANH TOÁN - TIỀN VỀ ADMIN =============

// ============= CẤU HÌNH TÀI KHOẢN ADMIN NHẬN TIỀN =============
const ADMIN_BANK_ACCOUNT = {
  bankName: 'Vietcombank',
  accountNumber: process.env.ADMIN_BANK_ACCOUNT || '1234567890',
  accountName: process.env.ADMIN_BANK_NAME || 'NGUYEN VAN A',
  bankCode: 'VCB'
};

// Danh sách ngân hàng hỗ trợ user nạp tiền (tiền vào tài khoản admin)
const SUPPORTED_BANKS = [
  { id: 'vcb', name: 'Vietcombank', code: 'VCB', adminAccount: ADMIN_BANK_ACCOUNT },
  { id: 'vtb', name: 'Vietinbank', code: 'ICB', adminAccount: ADMIN_BANK_ACCOUNT },
  { id: 'agb', name: 'Agribank', code: 'AGB', adminAccount: ADMIN_BANK_ACCOUNT },
  { id: 'bidv', name: 'BIDV', code: 'BIDV', adminAccount: ADMIN_BANK_ACCOUNT },
  { id: 'tcb', name: 'Techcombank', code: 'TCB', adminAccount: ADMIN_BANK_ACCOUNT },
  { id: 'mb', name: 'MB Bank', code: 'MB', adminAccount: ADMIN_BANK_ACCOUNT },
  { id: 'vp', name: 'VPBank', code: 'VPB', adminAccount: ADMIN_BANK_ACCOUNT }
];

// ============= USER NẠP TIỀN =============
// User chuyển khoản vào tài khoản ADMIN
app.post('/api/wallet/deposit', authenticateJWT, async (req, res) => {
  try {
    const { amount, bankId } = req.body;
    
    if (amount < 50000) {
      return res.status(400).json({ error: 'Số tiền nạp tối thiểu 50,000 VNĐ' });
    }
    
    const bank = SUPPORTED_BANKS.find(b => b.id === bankId);
    if (!bank) {
      return res.status(400).json({ error: 'Ngân hàng không được hỗ trợ' });
    }
    
    const reference = `NAP_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Tạo giao dịch chờ xác nhận
    const transaction = new Transaction({
      user: req.userId,
      type: 'deposit',
      amount: amount,
      status: 'pending',
      bankInfo: {
        bankName: bank.name,
        accountNumber: bank.adminAccount.accountNumber,
        accountName: bank.adminAccount.accountName,
        transactionId: reference
      },
      reference: reference
    });
    await transaction.save();
    
    // Trả về thông tin tài khoản ADMIN để user chuyển tiền vào
    res.json({
      success: true,
      transactionId: transaction._id,
      reference: reference,
      bankInfo: {
        bankName: bank.name,
        accountNumber: bank.adminAccount.accountNumber,
        accountName: bank.adminAccount.accountName,
        amount: amount,
        content: reference
      },
      message: `💳 Vui lòng chuyển ${amount.toLocaleString()}đ đến tài khoản:\n\n🏦 Ngân hàng: ${bank.name}\n🔢 Số TK: ${bank.adminAccount.accountNumber}\n👤 Chủ TK: ${bank.adminAccount.accountName}\n📝 Nội dung: ${reference}\n\n⏰ Sau khi chuyển, vui lòng xác nhận để cộng tiền vào ví.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= ADMIN XÁC NHẬN USER ĐÃ CHUYỂN TIỀN =============
// Sau khi user chuyển tiền, admin xác nhận -> cộng tiền vào ví user
app.post('/api/admin/confirm-deposit', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { reference } = req.body;
    
    const transaction = await Transaction.findOne({ reference });
    if (!transaction) {
      return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Giao dịch đã được xử lý' });
    }
    
    transaction.status = 'success';
    transaction.completedAt = new Date();
    await transaction.save();
    
    // Cộng tiền vào ví user (balance là tiền ảo trong hệ thống)
    const user = await User.findById(transaction.user);
    user.balance += transaction.amount;
    await user.save();
    
    // Gửi thông báo cho user
    await createNotification({
      userId: user._id,
      title: 'Nạp tiền thành công',
      content: `Bạn vừa nạp ${transaction.amount.toLocaleString()}đ vào ví SmartEdu. Số dư hiện tại: ${user.balance.toLocaleString()}đ`,
      type: 'success'
    });
    
    res.json({
      success: true,
      balance: user.balance,
      message: `Đã xác nhận nạp ${transaction.amount.toLocaleString()}đ cho user ${user.name}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= USER MUA KIM CƯƠNG BẰNG TIỀN TRONG VÍ =============
app.post('/api/wallet/buy-diamonds', authenticateJWT, async (req, res) => {
  try {
    const { diamonds } = req.body;
    const amount = diamonds * 500; // 1 kim cương = 500 VNĐ
    
    const user = await User.findById(req.userId);
    
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Số dư trong ví không đủ' });
    }
    
    // Trừ tiền trong ví, cộng kim cương
    user.balance -= amount;
    user.diamonds += diamonds;
    await user.save();
    
    // Ghi nhận giao dịch
    const transaction = new Transaction({
      user: req.userId,
      type: 'purchase_diamonds',
      amount: amount,
      diamonds: diamonds,
      description: `Mua ${diamonds} kim cương`,
      status: 'success',
      completedAt: new Date()
    });
    await transaction.save();
    
    res.json({
      success: true,
      balance: user.balance,
      diamonds: user.diamonds,
      message: `✨ Mua thành công ${diamonds} kim cương!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= USER MUA GÓI PRO/FAMILY =============
app.post('/api/subscription/upgrade', authenticateJWT, async (req, res) => {
  try {
    const { plan, duration } = req.body;
    const user = await User.findById(req.userId);
    
    let price = 0;
    let diamondsCost = 0;
    
    if (plan === 'pro') {
      if (duration === 'monthly') {
        price = 99000;
        diamondsCost = 198;
      } else {
        price = 499000;
        diamondsCost = 998;
      }
    } else if (plan === 'family') {
      if (duration === 'monthly') {
        price = 199000;
        diamondsCost = 398;
      } else {
        price = 999000;
        diamondsCost = 1998;
      }
    }
    
    // Kiểm tra thanh toán
    if (user.balance >= price) {
      user.balance -= price;
    } else if (user.diamonds >= diamondsCost) {
      user.diamonds -= diamondsCost;
    } else {
      return res.status(400).json({ 
        error: 'Không đủ tiền hoặc kim cương',
        needed: { balance: price, diamonds: diamondsCost },
        current: { balance: user.balance, diamonds: user.diamonds }
      });
    }
    
    // Cập nhật subscription
    user.subscription = plan;
    const durationDays = duration === 'monthly' ? 30 : 365;
    user.subscriptionExpires = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    await user.save();
    
    // Ghi nhận giao dịch
    const transaction = new Transaction({
      user: req.userId,
      type: 'subscription',
      amount: price,
      diamonds: diamondsCost,
      description: `Nâng cấp gói ${plan.toUpperCase()} ${duration === 'monthly' ? 'tháng' : 'năm'}`,
      status: 'success',
      completedAt: new Date()
    });
    await transaction.save();
    
    res.json({
      success: true,
      subscription: user.subscription,
      expiresAt: user.subscriptionExpires,
      balance: user.balance,
      diamonds: user.diamonds,
      message: `🎉 Nâng cấp thành công gói ${plan.toUpperCase()}!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= ADMIN RÚT TIỀN VỀ TÀI KHOẢN CÁ NHÂN =============
// Đây là tính năng dành riêng cho ADMIN
app.post('/api/admin/withdraw', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    
    if (!amount || amount < 500000) {
      return res.status(400).json({ error: 'Số tiền rút tối thiểu 500,000 VNĐ' });
    }
    
    // Kiểm tra tổng doanh thu trong hệ thống
    const totalRevenue = await Transaction.aggregate([
      { $match: { type: { $in: ['deposit', 'subscription', 'purchase_diamonds'] }, status: 'success' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const availableBalance = totalRevenue[0]?.total || 0;
    
    if (availableBalance < amount) {
      return res.status(400).json({ 
        error: 'Số dư doanh thu không đủ',
        available: availableBalance,
        requested: amount
      });
    }
    
    // Tạo yêu cầu rút tiền
    const withdrawal = new Withdrawal({
      user: req.userId,
      amount: amount,
      diamonds: 0,
      bankInfo: { bankName, accountNumber, accountName },
      status: 'processing',
      adminNote: 'Admin rút tiền về tài khoản cá nhân',
      processedBy: req.userId,
      processedAt: new Date()
    });
    await withdrawal.save();
    
    // Ghi nhận giao dịch rút tiền (trừ vào doanh thu)
    const transaction = new Transaction({
      user: req.userId,
      type: 'admin_withdraw',
      amount: -amount,
      description: `Admin rút ${amount.toLocaleString()}đ về tài khoản ${bankName} - ${accountNumber}`,
      status: 'success',
      completedAt: new Date(),
      reference: withdrawal._id.toString()
    });
    await transaction.save();
    
    res.json({
      success: true,
      withdrawalId: withdrawal._id,
      amount: amount,
      message: `✅ Đã tạo yêu cầu rút ${amount.toLocaleString()}đ về tài khoản:\n🏦 ${bankName}\n🔢 ${accountNumber}\n👤 ${accountName}\n\n⏰ Vui lòng kiểm tra tài khoản sau 24h.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= ADMIN XEM DOANH THU =============
app.get('/api/admin/revenue', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let startDate;
    
    switch(period) {
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Tổng tiền user đã nạp
    const deposits = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'success', completedAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    // Tổng tiền mua subscription
    const subscriptions = await Transaction.aggregate([
      { $match: { type: 'subscription', status: 'success', completedAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    // Tổng tiền mua kim cương
    const diamondPurchases = await Transaction.aggregate([
      { $match: { type: 'purchase_diamonds', status: 'success', completedAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    // Tổng tiền đã rút
    const withdrawals = await Transaction.aggregate([
      { $match: { type: 'admin_withdraw', status: 'success', completedAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const totalRevenue = (deposits[0]?.total || 0) + (subscriptions[0]?.total || 0) + (diamondPurchases[0]?.total || 0);
    const totalWithdrawn = Math.abs(withdrawals[0]?.total || 0);
    const availableBalance = totalRevenue - totalWithdrawn;
    
    // Thống kê user
    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await User.countDocuments({ 
      subscription: { $ne: 'free' }, 
      subscriptionExpires: { $gt: new Date() } 
    });
    
    // Thống kê theo ngày
    const dailyRevenue = await Transaction.aggregate([
      { 
        $match: { 
          type: { $in: ['deposit', 'subscription', 'purchase_diamonds'] }, 
          status: 'success',
          completedAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      period,
      totalRevenue,
      totalWithdrawn,
      availableBalance,
      breakdown: {
        deposits: deposits[0]?.total || 0,
        subscriptions: subscriptions[0]?.total || 0,
        diamondPurchases: diamondPurchases[0]?.total || 0
      },
      users: {
        total: totalUsers,
        activeSubscriptions: activeSubscriptions,
        freeUsers: totalUsers - activeSubscriptions
      },
      dailyRevenue: dailyRevenue.map(d => ({ date: d._id, amount: d.total })),
      adminBankAccount: ADMIN_BANK_ACCOUNT
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= API LẤY THÔNG TIN TÀI KHOẢN ADMIN ĐỂ USER NẠP TIỀN =============
app.get('/api/banks', authenticateJWT, async (req, res) => {
  // Trả về danh sách ngân hàng và tài khoản admin để user chuyển tiền vào
  res.json(SUPPORTED_BANKS.map(bank => ({
    id: bank.id,
    name: bank.name,
    accountNumber: bank.adminAccount.accountNumber,
    accountName: bank.adminAccount.accountName
  })));
});