// ============= marketplace_advanced.js - ADDITIONAL FEATURES =============

// ===== WISHLIST =====

const WishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    addedAt: { type: Date, default: Date.now }
  }]
});

const Wishlist = mongoose.model('Wishlist', WishlistSchema);

// Add to wishlist
app.post('/api/marketplace/wishlist/add', authenticateJWT, async (req, res) => {
  try {
    const { materialId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.userId, items: [] });
    }
    
    const exists = wishlist.items.some(item => item.material.toString() === materialId);
    if (!exists) {
      wishlist.items.push({ material: materialId });
      await wishlist.save();
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove from wishlist
app.delete('/api/marketplace/wishlist/remove/:materialId', authenticateJWT, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.userId });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(item => item.material.toString() !== req.params.materialId);
      await wishlist.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get wishlist
app.get('/api/marketplace/wishlist', authenticateJWT, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.userId }).populate('items.material');
    res.json(wishlist?.items || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== COUPON SYSTEM =====

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  usageLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  applicableSubjects: [{ type: String }],
  applicableGrades: [{ type: Number }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Coupon = mongoose.model('Coupon', CouponSchema);

// Apply coupon
app.post('/api/marketplace/coupon/apply', authenticateJWT, async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({ code, isActive: true });
    
    if (!coupon) {
      return res.status(404).json({ error: 'Mã giảm giá không hợp lệ' });
    }
    
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết hạn' });
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng' });
    }
    
    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({ error: `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString()}đ để sử dụng mã này` });
    }
    
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = subtotal * (coupon.discountValue / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }
    
    res.json({
      success: true,
      discount,
      coupon: {
        code: coupon.code,
        discountValue: coupon.discountValue,
        discountType: coupon.discountType
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== REVIEW HELPERS =====

// Mark review as helpful
app.post('/api/marketplace/reviews/:reviewId/helpful', authenticateJWT, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
    
    review.helpful += 1;
    await review.save();
    
    res.json({ helpful: review.helpful });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Report review
app.post('/api/marketplace/reviews/:reviewId/report', authenticateJWT, async (req, res) => {
  try {
    const { reason } = req.body;
    const report = new ReviewReport({
      review: req.params.reviewId,
      user: req.userId,
      reason
    });
    await report.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});