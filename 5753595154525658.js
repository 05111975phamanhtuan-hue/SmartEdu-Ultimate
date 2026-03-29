// ============= material_pricing.js - GIÁ TÀI LIỆU BẰNG VNĐ =============

// Cập nhật Material Schema
const MaterialSchema = new mongoose.Schema({
  // ... existing fields ...
  price: { type: Number, required: true, min: 0 }, // Giá VNĐ
  discountPrice: { type: Number, min: 0 },
  priceInDiamonds: { type: Number, default: 0 }, // Tự động chuyển đổi (500 VNĐ = 1💎)
  // ... existing fields ...
});

// Middleware: tự động tính giá kim cương
MaterialSchema.pre('save', function(next) {
  if (this.price > 0) {
    this.priceInDiamonds = Math.ceil(this.price / 500); // 500 VNĐ = 1💎
  }
  next();
});

// ===== API: TẠO TÀI LIỆU VỚI GIÁ VNĐ =====
app.post('/api/marketplace/materials', authenticateJWT, async (req, res) => {
  try {
    const { title, description, subject, grade, type, price, fileUrl, thumbnail } = req.body;
    const user = await User.findById(req.userId);
    
    if (!title || !description || !subject || !grade || !type || !fileUrl) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    if (price !== undefined && (price < 0 || price > 10000000)) {
      return res.status(400).json({ error: 'Giá tài liệu từ 0 - 10,000,000 VNĐ' });
    }
    
    // Kiểm tra quyền bán
    if (user.subscription === 'free') {
      return res.status(403).json({ error: 'Chỉ tài khoản Pro/VIP mới được đăng bán tài liệu' });
    }
    
    const material = new Material({
      title,
      description,
      subject,
      grade,
      type,
      price: price || 0,
      isFree: price === 0,
      fileUrl,
      thumbnail: thumbnail || null,
      author: user._id,
      authorName: user.name,
      authorAvatar: user.avatar,
      isPublished: true,
      isApproved: user.role === 'admin'
    });
    
    await material.save();
    
    res.json({ 
      success: true, 
      material,
      priceDisplay: `${price.toLocaleString()} VNĐ`,
      diamondsEquivalent: material.priceInDiamonds
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: CẬP NHẬT API CHECKOUT ĐỂ XỬ LÝ GIÁ VNĐ =====
app.post('/api/marketplace/checkout', authenticateJWT, async (req, res) => {
  try {
    const { paymentMethod } = req.body; // 'balance' (VNĐ) hoặc 'diamonds'
    const user = await User.findById(req.userId);
    const cart = await Cart.findOne({ user: req.userId }).populate('items.material');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }
    
    let subtotalVNĐ = 0;
    let subtotalDiamonds = 0;
    const orderItems = [];
    const sellersMap = new Map();
    
    for (const item of cart.items) {
      const material = item.material;
      const priceVNĐ = material.discountPrice || material.price;
      const priceDiamonds = material.priceInDiamonds;
      
      subtotalVNĐ += priceVNĐ;
      subtotalDiamonds += priceDiamonds;
      
      orderItems.push({
        material: material._id,
        title: material.title,
        priceVNĐ,
        priceDiamonds,
        seller: material.author
      });
      
      const sellerEarningVNĐ = priceVNĐ * 0.8;
      const platformFeeVNĐ = priceVNĐ * 0.2;
      const sellerEarningDiamonds = priceDiamonds * 0.8;
      
      if (!sellersMap.has(material.author.toString())) {
        sellersMap.set(material.author.toString(), {
          seller: material.author,
          totalEarningsVNĐ: 0,
          totalEarningsDiamonds: 0,
          items: []
        });
      }
      sellersMap.get(material.author.toString()).totalEarningsVNĐ += sellerEarningVNĐ;
      sellersMap.get(material.author.toString()).totalEarningsDiamonds += sellerEarningDiamonds;
    }
    
    // Kiểm tra thanh toán
    let total = 0;
    if (paymentMethod === 'balance') {
      total = subtotalVNĐ;
      if (user.balance < total) {
        return res.status(400).json({ error: 'Không đủ tiền trong ví', balance: user.balance, required: total });
      }
      user.balance -= total;
    } else if (paymentMethod === 'diamonds') {
      total = subtotalDiamonds;
      if (user.diamonds < total) {
        return res.status(400).json({ error: 'Không đủ kim cương', diamonds: user.diamonds, required: total });
      }
      user.diamonds -= total;
    }
    
    await user.save();
    
    // Tạo order
    const order = new Order({
      user: user._id,
      items: orderItems,
      subtotalVNĐ,
      subtotalDiamonds,
      total: paymentMethod === 'balance' ? subtotalVNĐ : subtotalDiamonds,
      paymentMethod,
      status: 'completed',
      completedAt: new Date()
    });
    await order.save();
    
    // Phân phối tiền cho người bán
    for (const [sellerId, sellerData] of sellersMap) {
      const seller = await User.findById(sellerId);
      if (paymentMethod === 'balance') {
        seller.balance += sellerData.totalEarningsVNĐ;
      } else {
        seller.diamonds += sellerData.totalEarningsDiamonds;
      }
      await seller.save();
      
      // Ghi nhận earnings
      for (const item of sellerData.items) {
        const earnings = new SellerEarnings({
          seller: sellerId,
          material: item.material,
          order: order._id,
          amount: paymentMethod === 'balance' ? item.sellerEarningVNĐ : item.sellerEarningDiamonds,
          originalAmount: paymentMethod === 'balance' ? item.priceVNĐ : item.priceDiamonds,
          platformFee: paymentMethod === 'balance' ? item.platformFeeVNĐ : item.platformFeeDiamonds,
          currency: paymentMethod === 'balance' ? 'VND' : 'DIAMOND',
          status: 'available'
        });
        await earnings.save();
        
        await Material.findByIdAndUpdate(item.material, { $inc: { downloads: 1 } });
      }
      
      await createNotification({
        userId: sellerId,
        type: 'sale',
        title: 'Bạn vừa bán được tài liệu!',
        content: `Bạn đã bán được tài liệu với giá ${paymentMethod === 'balance' ? sellerData.totalEarningsVNĐ.toLocaleString() + 'đ' : sellerData.totalEarningsDiamonds + '💎'}.`,
        data: { orderId: order._id, amount: sellerData.totalEarningsVNĐ || sellerData.totalEarningsDiamonds }
      });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({
      success: true,
      order,
      balance: user.balance,
      diamonds: user.diamonds,
      message: 'Thanh toán thành công!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});