// ============= MODULE 5: ENERGY & FINANCIAL SYSTEM =============
// Thêm vào server.js

// ============= ENERGY SYSTEM =============
const ENERGY_CONFIG = {
  MAX_ENERGY: 25,
  INITIAL_ENERGY: 25,
  PENALTY_WRONG_ANSWER: 3,
  REWARD_CORRECT_ANSWER: 2,
  REWARD_WATCH_AD: 3,
  REWARD_PRACTICE: 2,
  RECOVERY_RATE: 3, // 3 điểm mỗi lần
  RECOVERY_INTERVAL_HOURS: 5 // 5 giờ hồi 3 điểm
};

// Cập nhật năng lượng tự động
const updateEnergy = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;
  
  const now = new Date();
  const lastReset = new Date(user.lastEnergyReset);
  const hoursPassed = (now - lastReset) / (1000 * 60 * 60);
  
  if (hoursPassed >= ENERGY_CONFIG.RECOVERY_INTERVAL_HOURS) {
    const recoveryCount = Math.floor(hoursPassed / ENERGY_CONFIG.RECOVERY_INTERVAL_HOURS);
    const newEnergy = Math.min(
      ENERGY_CONFIG.MAX_ENERGY,
      user.energy + (recoveryCount * ENERGY_CONFIG.RECOVERY_RATE)
    );
    user.energy = newEnergy;
    user.lastEnergyReset = now;
    await user.save();
  }
  
  return user.energy;
};

// Sử dụng năng lượng
const useEnergy = async (userId, amount = 1) => {
  const user = await User.findById(userId);
  if (!user) return false;
  
  await updateEnergy(userId);
  
  if (user.energy < amount) {
    return false;
  }
  
  user.energy -= amount;
  await user.save();
  return true;
};

// API: Lấy thông tin năng lượng
app.get('/api/energy', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const energy = await updateEnergy(req.userId);
    
    // Tính thời gian hồi tiếp theo
    const lastReset = new Date(user.lastEnergyReset);
    const nextRecovery = new Date(lastReset.getTime() + ENERGY_CONFIG.RECOVERY_INTERVAL_HOURS * 60 * 60 * 1000);
    const secondsToNext = Math.max(0, Math.floor((nextRecovery - new Date()) / 1000));
    
    res.json({
      current: energy,
      max: ENERGY_CONFIG.MAX_ENERGY,
      nextRecoveryIn: secondsToNext,
      recoveryAmount: ENERGY_CONFIG.RECOVERY_RATE,
      recoveryInterval: ENERGY_CONFIG.RECOVERY_INTERVAL_HOURS
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Xem quảng cáo nhận năng lượng
app.post('/api/energy/watch-ad', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const newEnergy = Math.min(
      ENERGY_CONFIG.MAX_ENERGY,
      user.energy + ENERGY_CONFIG.REWARD_WATCH_AD
    );
    user.energy = newEnergy;
    await user.save();
    
    // Ghi nhận xem quảng cáo (để tính doanh thu)
    const adView = new AdView({
      user: user._id,
      type: 'energy',
      reward: ENERGY_CONFIG.REWARD_WATCH_AD,
      createdAt: new Date()
    });
    await adView.save();
    
    res.json({ 
      success: true, 
      energy: user.energy,
      message: `Nhận ${ENERGY_CONFIG.REWARD_WATCH_AD} năng lượng!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Luyện tập nhận năng lượng
app.post('/api/energy/practice', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const newEnergy = Math.min(
      ENERGY_CONFIG.MAX_ENERGY,
      user.energy + ENERGY_CONFIG.REWARD_PRACTICE
    );
    user.energy = newEnergy;
    await user.save();
    
    res.json({ 
      success: true, 
      energy: user.energy,
      message: `Luyện tập tốt! Nhận ${ENERGY_CONFIG.REWARD_PRACTICE} năng lượng`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= STREAK SYSTEM =============
const STREAK_CONFIG = {
  REWARD_XP: {
    7: 100,    // 7 ngày: 100 XP
    14: 200,   // 14 ngày: 200 XP
    30: 500,   // 30 ngày: 500 XP
    60: 1000,  // 60 ngày: 1000 XP
    100: 2000, // 100 ngày: 2000 XP
    365: 10000 // 1 năm: 10000 XP
  },
  REWARD_DIAMONDS: {
    7: 10,
    14: 20,
    30: 50,
    60: 100,
    100: 200,
    365: 1000
  }
};

// Cập nhật streak khi hoàn thành bài học
const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;
  
  const today = new Date().toDateString();
  const lastActive = new Date(user.lastActive).toDateString();
  
  if (lastActive === today) {
    return user.streak; // Đã active hôm nay
  }
  
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  let newStreak = user.streak;
  let streakBonus = { xp: 0, diamonds: 0 };
  
  if (lastActive === yesterday) {
    // Duy trì streak
    newStreak = user.streak + 1;
    
    // Thưởng streak milestone
    if (STREAK_CONFIG.REWARD_XP[newStreak]) {
      streakBonus.xp = STREAK_CONFIG.REWARD_XP[newStreak];
      streakBonus.diamonds = STREAK_CONFIG.REWARD_DIAMONDS[newStreak];
      user.xp += streakBonus.xp;
      user.diamonds += streakBonus.diamonds;
      
      // Thêm badge
      user.badges.push(`streak_${newStreak}`);
    }
  } else {
    // Reset streak
    newStreak = 1;
  }
  
  user.streak = newStreak;
  user.lastActive = new Date();
  await user.save();
  
  return { streak: newStreak, bonus: streakBonus };
};

// API: Lấy thông tin streak
app.get('/api/streak', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const today = new Date().toDateString();
    const lastActive = new Date(user.lastActive).toDateString();
    const isActiveToday = lastActive === today;
    
    // Tính streak sắp tới
    let nextMilestone = null;
    const milestones = Object.keys(STREAK_CONFIG.REWARD_XP).map(Number).sort((a,b) => a-b);
    for (const milestone of milestones) {
      if (milestone > user.streak) {
        nextMilestone = {
          days: milestone,
          xpReward: STREAK_CONFIG.REWARD_XP[milestone],
          diamondReward: STREAK_CONFIG.REWARD_DIAMONDS[milestone],
          daysLeft: milestone - user.streak
        };
        break;
      }
    }
    
    res.json({
      currentStreak: user.streak,
      isActiveToday,
      bestStreak: user.bestStreak || user.streak,
      nextMilestone,
      streakHistory: user.streakHistory || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= FINANCIAL SYSTEM (TIỀN TỆ) =============
const DIAMOND_CONFIG = {
  PRICE_PER_DIAMOND: 500, // 1 kim cương = 500 VNĐ
  EXCHANGE_RATE: 100, // 100 kim cương = 50,000 VNĐ
  REWARD_PER_LESSON: 1, // Mỗi bài học hoàn thành +1 kim cương
  REWARD_PER_STREAK_MILESTONE: 10
};

// Ngân hàng hỗ trợ
const SUPPORTED_BANKS = [
  { id: 'vcb', name: 'Vietcombank', code: 'VCB', accountNumber: '1234567890', accountName: 'SmartEdu Education' },
  { id: 'vtb', name: 'Vietinbank', code: 'ICB', accountNumber: '1234567891', accountName: 'SmartEdu Education' },
  { id: 'agb', name: 'Agribank', code: 'AGB', accountNumber: '1234567892', accountName: 'SmartEdu Education' },
  { id: 'bidv', name: 'BIDV', code: 'BIDV', accountNumber: '1234567893', accountName: 'SmartEdu Education' },
  { id: 'tcb', name: 'Techcombank', code: 'TCB', accountNumber: '1234567894', accountName: 'SmartEdu Education' },
  { id: 'mb', name: 'MB Bank', code: 'MB', accountNumber: '1234567895', accountName: 'SmartEdu Education' },
  { id: 'vp', name: 'VPBank', code: 'VPB', accountNumber: '1234567896', accountName: 'SmartEdu Education' },
  { id: 'sacombank', name: 'Sacombank', code: 'STB', accountNumber: '1234567897', accountName: 'SmartEdu Education' }
];

// Model giao dịch
const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdraw', 'purchase_diamonds', 'subscription', 'material_purchase', 'reward'], required: true },
  amount: { type: Number, default: 0 }, // Số tiền VNĐ
  diamonds: { type: Number, default: 0 }, // Số kim cương
  description: { type: String },
  status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' },
  bankInfo: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    transactionId: String
  },
  reference: { type: String, unique: true },
  metadata: mongoose.Schema.Types.Mixed,
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

// Model yêu cầu rút tiền
const WithdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  diamonds: { type: Number, required: true },
  bankInfo: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending' },
  adminNote: String,
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const Withdrawal = mongoose.model('Withdrawal', WithdrawalSchema);

// API: Lấy số dư ví
app.get('/api/wallet', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('balance diamonds');
    const transactions = await Transaction.find({ user: req.userId, status: 'success' })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      balance: user.balance,
      diamonds: user.diamonds,
      recentTransactions: transactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Nạp tiền (tạo yêu cầu chuyển khoản)
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
    
    const reference = `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    const transaction = new Transaction({
      user: req.userId,
      type: 'deposit',
      amount: amount,
      status: 'pending',
      bankInfo: {
        bankName: bank.name,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName,
        transactionId: reference
      },
      reference: reference
    });
    await transaction.save();
    
    res.json({
      success: true,
      transactionId: transaction._id,
      reference: reference,
      bankInfo: {
        bankName: bank.name,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName,
        amount: amount,
        content: reference
      },
      message: `Vui lòng chuyển ${amount.toLocaleString()}đ đến tài khoản trên với nội dung: ${reference}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Xác nhận nạp tiền (webhook từ ngân hàng - mô phỏng)
app.post('/api/wallet/confirm-deposit', authenticateJWT, async (req, res) => {
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
    
    const user = await User.findById(transaction.user);
    user.balance += transaction.amount;
    await user.save();
    
    res.json({
      success: true,
      balance: user.balance,
      message: `Nạp thành công ${transaction.amount.toLocaleString()}đ vào ví`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Mua kim cương bằng tiền trong ví
app.post('/api/wallet/buy-diamonds', authenticateJWT, async (req, res) => {
  try {
    const { diamonds } = req.body;
    const amount = diamonds * DIAMOND_CONFIG.PRICE_PER_DIAMOND;
    
    const user = await User.findById(req.userId);
    
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Số dư không đủ' });
    }
    
    user.balance -= amount;
    user.diamonds += diamonds;
    await user.save();
    
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
      message: `Mua thành công ${diamonds} kim cương`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Yêu cầu rút tiền
app.post('/api/wallet/withdraw', authenticateJWT, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    const diamondsNeeded = amount / DIAMOND_CONFIG.PRICE_PER_DIAMOND;
    
    const user = await User.findById(req.userId);
    
    if (user.diamonds < diamondsNeeded) {
      return res.status(400).json({ error: 'Không đủ kim cương để rút' });
    }
    
    // Tạo yêu cầu rút tiền
    const withdrawal = new Withdrawal({
      user: req.userId,
      amount: amount,
      diamonds: diamondsNeeded,
      bankInfo: { bankName, accountNumber, accountName },
      status: 'pending'
    });
    await withdrawal.save();
    
    // Trừ kim cương tạm thời
    user.diamonds -= diamondsNeeded;
    await user.save();
    
    // Ghi nhận giao dịch
    const transaction = new Transaction({
      user: req.userId,
      type: 'withdraw',
      amount: amount,
      diamonds: diamondsNeeded,
      description: `Yêu cầu rút ${amount.toLocaleString()}đ`,
      status: 'pending',
      reference: withdrawal._id.toString()
    });
    await transaction.save();
    
    res.json({
      success: true,
      withdrawalId: withdrawal._id,
      message: `Yêu cầu rút ${amount.toLocaleString()}đ đã được ghi nhận. Sẽ xử lý trong 24-48h.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Lấy danh sách ngân hàng hỗ trợ
app.get('/api/banks', authenticateJWT, async (req, res) => {
  res.json(SUPPORTED_BANKS);
});

// API: Nâng cấp gói Pro/Family
app.post('/api/subscription/upgrade', authenticateJWT, async (req, res) => {
  try {
    const { plan, duration } = req.body; // plan: 'pro' hoặc 'family', duration: 'monthly' hoặc 'yearly'
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
    
    // Kiểm tra thanh toán bằng tiền mặt hay kim cương
    let paymentMethod = '';
    if (user.balance >= price) {
      user.balance -= price;
      paymentMethod = 'balance';
    } else if (user.diamonds >= diamondsCost) {
      user.diamonds -= diamondsCost;
      paymentMethod = 'diamonds';
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
      message: `Nâng cấp thành công gói ${plan.toUpperCase()}!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Admin - Xử lý rút tiền
app.post('/api/admin/withdrawals/:id/process', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    
    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    }
    
    withdrawal.status = status;
    withdrawal.adminNote = adminNote;
    withdrawal.processedBy = req.userId;
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    
    // Cập nhật transaction
    await Transaction.findOneAndUpdate(
      { reference: id },
      { status: status === 'completed' ? 'success' : 'failed' }
    );
    
    // Nếu từ chối, hoàn lại kim cương
    if (status === 'rejected') {
      const user = await User.findById(withdrawal.user);
      user.diamonds += withdrawal.diamonds;
      await user.save();
    }
    
    res.json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Admin - Thống kê doanh thu
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
    
    const transactions = await Transaction.find({
      status: 'success',
      completedAt: { $gte: startDate },
      type: { $in: ['subscription', 'purchase_diamonds'] }
    });
    
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const subscriptionRevenue = transactions.filter(t => t.type === 'subscription').reduce((sum, t) => sum + t.amount, 0);
    const diamondRevenue = transactions.filter(t => t.type === 'purchase_diamonds').reduce((sum, t) => sum + t.amount, 0);
    
    const dailyRevenue = {};
    transactions.forEach(t => {
      const date = t.completedAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + t.amount;
    });
    
    res.json({
      period,
      totalRevenue,
      subscriptionRevenue,
      diamondRevenue,
      dailyRevenue,
      totalTransactions: transactions.length,
      totalUsers: await User.countDocuments(),
      activeSubscriptions: await User.countDocuments({ subscription: { $ne: 'free' }, subscriptionExpires: { $gt: new Date() } })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});