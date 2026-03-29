// ============= admin_wallet_system.js - QUẢN LÝ VÍ ADMIN =============

// Khởi tạo ví admin nếu chưa có
const initAdminWallet = async () => {
  let wallet = await AdminWallet.findOne();
  if (!wallet) {
    wallet = new AdminWallet({ totalBalance: 0, availableForWithdrawal: 0 });
    await wallet.save();
  }
  return wallet;
};

// ===== CẬP NHẬT VÍ ADMIN KHI CÓ GIAO DỊCH =====
const updateAdminWallet = async (type, amount, userId, description) => {
  let wallet = await AdminWallet.findOne();
  if (!wallet) wallet = await initAdminWallet();
  
  wallet.transactions.push({
    type,
    amount,
    userId,
    description,
    createdAt: new Date()
  });
  
  if (type === 'deposit') {
    // User nạp tiền vào (tiền thật vào tài khoản admin)
    wallet.totalBalance += amount;
    // KHÔNG cộng vào availableForWithdrawal vì đây là tiền nạp, không thể rút
  } else if (type === 'material_purchase') {
    // User mua tài liệu
    wallet.totalBalance += amount; // tiền vào admin
    // Tiền sẽ được chuyển đến người bán sau khi được duyệt
  } else if (type === 'material_sale') {
    // Người bán được cộng tiền (chờ duyệt)
    wallet.availableForWithdrawal += amount;
  } else if (type === 'withdrawal') {
    wallet.pendingWithdrawals += amount;
  } else if (type === 'withdrawal_complete') {
    wallet.pendingWithdrawals -= amount;
    wallet.totalWithdrawn += amount;
  } else if (type === 'fee') {
    wallet.totalBalance -= amount;
  }
  
  wallet.updatedAt = new Date();
  await wallet.save();
  return wallet;
};

// ===== API: XEM VÍ ADMIN (CHỈ SUPER ADMIN) =====
app.get('/api/admin/wallet', authenticateJWT, authenticateSuperAdmin, async (req, res) => {
  try {
    const wallet = await AdminWallet.findOne();
    if (!wallet) await initAdminWallet();
    
    // Tính số tiền có thể rút (chỉ từ bán tài liệu)
    const availableFromSales = wallet.availableForWithdrawal;
    const pendingAmount = wallet.pendingWithdrawals;
    
    res.json({
      totalBalance: wallet.totalBalance,
      availableForWithdrawal: availableFromSales,
      pendingWithdrawals: pendingAmount,
      totalWithdrawn: wallet.totalWithdrawn,
      canWithdraw: availableFromSales > 0,
      recentTransactions: wallet.transactions.slice(-20).reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: SUPER ADMIN RÚT TIỀN TỪ VÍ (KHÔNG CẦN DUYỆT) =====
app.post('/api/admin/wallet/withdraw', authenticateJWT, authenticateSuperAdmin, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    const wallet = await AdminWallet.findOne();
    
    if (!wallet) return res.status(404).json({ error: 'Không tìm thấy ví admin' });
    if (wallet.availableForWithdrawal < amount) {
      return res.status(400).json({ 
        error: 'Số dư khả dụng không đủ',
        available: wallet.availableForWithdrawal,
        requested: amount
      });
    }
    
    // Trừ số tiền khả dụng
    wallet.availableForWithdrawal -= amount;
    wallet.totalWithdrawn += amount;
    
    wallet.transactions.push({
      type: 'withdrawal_complete',
      amount: -amount,
      userId: req.userId,
      description: `Super admin rút ${amount.toLocaleString()}đ về ${bankName} - ${accountNumber}`,
      createdAt: new Date()
    });
    
    await wallet.save();
    
    // Ghi nhận giao dịch rút
    const transaction = new Transaction({
      user: req.userId,
      type: 'admin_withdraw',
      amount: -amount,
      description: `Super admin rút ${amount.toLocaleString()}đ về ${bankName} - ${accountNumber}`,
      status: 'success',
      completedAt: new Date(),
      bankInfo: { bankName, accountNumber, accountName }
    });
    await transaction.save();
    
    // Gửi thông báo cho các admin phụ
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        type: 'admin_withdraw',
        title: 'Rút tiền từ ví admin',
        content: `Super admin đã rút ${amount.toLocaleString()}đ từ ví hệ thống.`,
        data: { amount, withdrawnBy: req.user.name }
      });
    }
    
    res.json({
      success: true,
      message: `Đã rút ${amount.toLocaleString()}đ thành công!`,
      remainingBalance: wallet.availableForWithdrawal,
      totalWithdrawn: wallet.totalWithdrawn
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});