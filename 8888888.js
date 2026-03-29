// ============= marketplace_seller.js - BÁN TÀI LIỆU & RÚT TIỀN =============

// ===== SELLER EARNINGS MODEL =====
const SellerEarningsSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  amount: { type: Number, required: true }, // số tiền nhận được (sau khi trừ phí)
  originalAmount: { type: Number, required: true }, // số tiền gốc
  platformFee: { type: Number, required: true }, // phí nền tảng (20%)
  status: { type: String, enum: ['pending', 'available', 'withdrawn'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  withdrawnAt: { type: Date }
});

// ===== WITHDRAWAL REQUEST MODEL =====
const WithdrawalRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  bankInfo: {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true }
  },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending' },
  adminNote: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const SellerEarnings = mongoose.model('SellerEarnings', SellerEarningsSchema);
const WithdrawalRequest = mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);

// ===== SỬA API CHECKOUT - THÊM PHÂN PHỐI TIỀN CHO NGƯỜI BÁN =====
app.post('/api/marketplace/checkout', authenticateJWT, async (req, res) => {
  try {
    const { paymentMethod, couponCode } = req.body;
    const user = await User.findById(req.userId);
    const cart = await Cart.findOne({ user: req.userId }).populate('items.material');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }
    
    let subtotal = 0;
    const orderItems = [];
    const sellersMap = new Map(); // Để gộp tiền cho từng người bán
    
    for (const item of cart.items) {
      const material = item.material;
      const price = material.discountPrice || material.price;
      subtotal += price;
      orderItems.push({
        material: material._id,
        title: material.title,
        price: material.price,
        discountPrice: material.discountPrice,
        seller: material.author
      });
      
      // Tính tiền cho người bán (80% sau phí)
      const sellerEarning = price * 0.8;
      const platformFee = price * 0.2;
      
      if (!sellersMap.has(material.author.toString())) {
        sellersMap.set(material.author.toString(), {
          seller: material.author,
          totalEarnings: 0,
          items: []
        });
      }
      sellersMap.get(material.author.toString()).totalEarnings += sellerEarning;
      sellersMap.get(material.author.toString()).items.push({
        material: material._id,
        price,
        sellerEarning,
        platformFee
      });
    }
    
    // Áp dụng coupon nếu có
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon && coupon.validFrom <= new Date() && coupon.validTo >= new Date()) {
        if (coupon.discountType === 'percentage') {
          discount = subtotal * (coupon.discountValue / 100);
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.discountValue;
        }
        coupon.usedCount += 1;
        await coupon.save();
      }
    }
    
    const total = subtotal - discount;
    
    // Kiểm tra thanh toán
    if (paymentMethod === 'diamonds') {
      if (user.diamonds < total) {
        return res.status(400).json({ error: 'Không đủ kim cương' });
      }
      user.diamonds -= total;
    } else if (paymentMethod === 'balance') {
      if (user.balance < total) {
        return res.status(400).json({ error: 'Không đủ tiền trong ví' });
      }
      user.balance -= total;
    } else {
      return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
    }
    
    await user.save();
    
    // Tạo order
    const order = new Order({
      user: user._id,
      items: orderItems,
      subtotal,
      discount,
      total,
      paymentMethod,
      status: 'completed',
      completedAt: new Date()
    });
    await order.save();
    
    // ===== PHÂN PHỐI TIỀN CHO NGƯỜI BÁN =====
    for (const [sellerId, sellerData] of sellersMap) {
      // Cập nhật số dư cho người bán
      const seller = await User.findById(sellerId);
      seller.balance += sellerData.totalEarnings;
      await seller.save();
      
      // Ghi nhận earnings
      for (const item of sellerData.items) {
        const earnings = new SellerEarnings({
          seller: sellerId,
          material: item.material,
          order: order._id,
          amount: item.sellerEarning,
          originalAmount: item.price,
          platformFee: item.platformFee,
          status: 'available'
        });
        await earnings.save();
        
        // Cập nhật downloads cho tài liệu
        await Material.findByIdAndUpdate(item.material, { $inc: { downloads: 1 } });
      }
      
      // Tạo thông báo cho người bán
      await createNotification({
        userId: sellerId,
        type: 'sale',
        title: 'Bạn vừa bán được tài liệu!',
        content: `Bạn đã bán được tài liệu với tổng giá trị ${sellerData.totalEarnings.toLocaleString()}đ. Tiền đã được cộng vào ví của bạn.`,
        data: { orderId: order._id, amount: sellerData.totalEarnings }
      });
    }
    
    // Xóa giỏ hàng
    cart.items = [];
    await cart.save();
    
    res.json({
      success: true,
      order,
      diamonds: user.diamonds,
      balance: user.balance,
      message: 'Thanh toán thành công!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: XEM SỐ DƯ CÓ THỂ RÚT =====
app.get('/api/seller/earnings', authenticateJWT, async (req, res) => {
  try {
    const earnings = await SellerEarnings.aggregate([
      { $match: { seller: req.userId, status: 'available' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const withdrawn = await SellerEarnings.aggregate([
      { $match: { seller: req.userId, status: 'withdrawn' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const details = await SellerEarnings.find({ seller: req.userId })
      .populate('material', 'title')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      availableBalance: earnings[0]?.total || 0,
      totalWithdrawn: withdrawn[0]?.total || 0,
      totalEarned: (earnings[0]?.total || 0) + (withdrawn[0]?.total || 0),
      transactions: details
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: YÊU CẦU RÚT TIỀN =====
app.post('/api/seller/withdraw', authenticateJWT, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    
    if (!amount || amount < 50000) {
      return res.status(400).json({ error: 'Số tiền rút tối thiểu 50,000 VNĐ' });
    }
    
    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin ngân hàng' });
    }
    
    // Kiểm tra số dư có thể rút
    const earnings = await SellerEarnings.aggregate([
      { $match: { seller: req.userId, status: 'available' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const availableBalance = earnings[0]?.total || 0;
    
    if (availableBalance < amount) {
      return res.status(400).json({ 
        error: 'Số dư không đủ để rút',
        available: availableBalance,
        requested: amount
      });
    }
    
    // Trừ số tiền khỏi earnings
    let remainingToDeduct = amount;
    const earningsToUpdate = await SellerEarnings.find({ 
      seller: req.userId, 
      status: 'available' 
    }).sort({ createdAt: 1 });
    
    for (const earning of earningsToUpdate) {
      if (remainingToDeduct <= 0) break;
      
      if (earning.amount <= remainingToDeduct) {
        earning.status = 'withdrawn';
        earning.withdrawnAt = new Date();
        remainingToDeduct -= earning.amount;
      } else {
        // Nếu không đủ, tách thành 2 phần
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
    
    // Tạo yêu cầu rút tiền
    const withdrawalRequest = new WithdrawalRequest({
      user: req.userId,
      amount: amount,
      bankInfo: { bankName, accountNumber, accountName },
      status: 'pending'
    });
    await withdrawalRequest.save();
    
    // Ghi nhận giao dịch
    const transaction = new Transaction({
      user: req.userId,
      type: 'withdraw_request',
      amount: -amount,
      description: `Yêu cầu rút ${amount.toLocaleString()}đ về ${bankName} - ${accountNumber}`,
      status: 'pending',
      reference: withdrawalRequest._id.toString()
    });
    await transaction.save();
    
    // Thông báo admin
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        type: 'withdraw_request',
        title: 'Yêu cầu rút tiền mới',
        content: `${req.user.name} yêu cầu rút ${amount.toLocaleString()}đ`,
        data: { withdrawalId: withdrawalRequest._id, userId: req.userId, amount }
      });
    }
    
    res.json({
      success: true,
      withdrawalId: withdrawalRequest._id,
      message: `Yêu cầu rút ${amount.toLocaleString()}đ đã được ghi nhận. Admin sẽ xử lý trong 24-48h.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN XỬ LÝ YÊU CẦU RÚT TIỀN =====
app.patch('/api/admin/withdrawals/:withdrawalId', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const withdrawal = await WithdrawalRequest.findById(req.params.withdrawalId);
    
    if (!withdrawal) return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    
    withdrawal.status = status;
    withdrawal.adminNote = adminNote;
    withdrawal.processedBy = req.userId;
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    
    // Cập nhật transaction
    await Transaction.findOneAndUpdate(
      { reference: withdrawal._id.toString() },
      { status: status === 'completed' ? 'success' : 'failed' }
    );
    
    // Thông báo cho người dùng
    const user = await User.findById(withdrawal.user);
    await createNotification({
      userId: user._id,
      type: 'withdraw_status',
      title: status === 'completed' ? 'Rút tiền thành công' : 'Rút tiền thất bại',
      content: status === 'completed' 
        ? `Yêu cầu rút ${withdrawal.amount.toLocaleString()}đ đã được xử lý thành công.`
        : `Yêu cầu rút tiền của bạn bị từ chối. Lý do: ${adminNote}`,
      data: { withdrawalId: withdrawal._id, status, amount: withdrawal.amount }
    });
    
    res.json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN XEM DANH SÁCH YÊU CẦU RÚT TIỀN =====
app.get('/api/admin/withdrawals', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const query = {};
    if (status !== 'all') query.status = status;
    
    const withdrawals = await WithdrawalRequest.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await WithdrawalRequest.countDocuments(query);
    
    res.json({
      withdrawals,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});